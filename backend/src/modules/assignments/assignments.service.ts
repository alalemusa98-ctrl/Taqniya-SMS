import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { UpdateAssignmentDto } from './dto/update-assignment.dto.js';
import { QueryAssignmentDto } from './dto/query-assignment.dto.js';
import { RoleType } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Resolve active academic year and term
   */
  private async resolveYearAndTerm(yearId?: number, termId?: number) {
    let year: any = null;
    if (yearId) {
      year = await this.prisma.academicYear.findUnique({
        where: { id: BigInt(yearId) },
      });
    }
    if (!year) {
      year = await this.prisma.academicYear.findFirst({
        where: { is_active: 1, deleted_at: null },
        orderBy: { id: 'desc' },
      });
    }
    if (!year) {
      year = await this.prisma.academicYear.findFirst({
        orderBy: { id: 'desc' },
      });
    }

    let term: any = null;
    if (termId) {
      term = await this.prisma.academicTerm.findUnique({
        where: { id: BigInt(termId) },
      });
    }
    if (!term) {
      term = await this.prisma.academicTerm.findFirst({
        where: { deleted_at: null },
        orderBy: { id: 'asc' },
      });
    }
    if (!term) {
      term = await this.prisma.academicTerm.findFirst({
        orderBy: { id: 'asc' },
      });
    }

    return { year, term };
  }

  /**
   * 1.1 GET /api/v1/assignments
   * Hierarchical list grouped by Class -> Section -> Assignments
   */
  async findAll(query: QueryAssignmentDto, currentUser?: any) {
    const { year, term } = await this.resolveYearAndTerm(
      query.academic_year_id,
      query.academic_term_id,
    );

    if (!year) {
      return {
        success: true,
        message: 'لا توجد بيانات للعام الدراسي المحدد.',
        data: {
          academic_year_id: null,
          academic_year_name: '',
          academic_term_id: null,
          academic_term_name: '',
          classes: [],
        },
        meta: {
          total: 0,
          page: query.page || 1,
          per_page: query.per_page || 15,
          total_pages: 0,
        },
      };
    }

    const where: any = {
      academic_year_id: year.id,
      deleted_at: null,
    };

    if (term && !query.academic_term_id) {
      where.academic_term_id = term.id;
    } else if (query.academic_term_id) {
      where.academic_term_id = BigInt(query.academic_term_id);
    }

    // Role-based scope restrictions
    if (currentUser?.role_type === RoleType.student) {
      const student = await this.prisma.student.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (student) {
        const enrollment = await this.prisma.studentEnrollment.findFirst({
          where: {
            student_id: student.id,
            academic_year_id: year.id,
            deleted_at: null,
          },
        });
        if (enrollment) {
          where.class_section_id = enrollment.class_section_id;
        } else {
          return {
            success: true,
            message: 'الطالب غير مسكن في أي شعبة للعام الدراسي الحالي.',
            data: {
              academic_year_id: Number(year.id),
              academic_year_name: year.name,
              academic_term_id: term ? Number(term.id) : null,
              academic_term_name: term ? term.name : '',
              classes: [],
            },
            meta: { total: 0, page: 1, per_page: query.per_page || 15, total_pages: 0 },
          };
        }
      }
    } else if (currentUser?.role_type === RoleType.parent) {
      const guardian = await this.prisma.guardian.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (guardian) {
        const links = await this.prisma.guardianStudent.findMany({
          where: { guardian_id: guardian.id, deleted_at: null },
        });
        const studentIds = links.map((l) => l.student_id);
        const enrollments = await this.prisma.studentEnrollment.findMany({
          where: {
            student_id: { in: studentIds },
            academic_year_id: year.id,
            deleted_at: null,
          },
        });
        const sectionIds = enrollments.map((e) => e.class_section_id);
        if (sectionIds.length === 0) {
          return {
            success: true,
            message: 'لا توجد شعب مسكن بها أبناء ولي الأمر بالعام الدراسي المحدد.',
            data: {
              academic_year_id: Number(year.id),
              academic_year_name: year.name,
              academic_term_id: term ? Number(term.id) : null,
              academic_term_name: term ? term.name : '',
              classes: [],
            },
            meta: { total: 0, page: 1, per_page: query.per_page || 15, total_pages: 0 },
          };
        }
        if (query.class_section_id) {
          const requestedSecId = BigInt(query.class_section_id);
          if (sectionIds.some((id) => id === requestedSecId)) {
            where.class_section_id = requestedSecId;
          } else {
            where.class_section_id = { in: sectionIds };
          }
        } else {
          where.class_section_id = { in: sectionIds };
        }
      }
    } else {
      if (query.class_section_id) {
        where.class_section_id = BigInt(query.class_section_id);
      }
    }

    if (query.teaching_assignment_id) {
      where.teaching_assignment_id = BigInt(query.teaching_assignment_id);
    }

    if (query.due_date) {
      where.due_date = new Date(query.due_date);
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    if (query.status === 'active') {
      where.due_date = { gte: todayDate };
    } else if (query.status === 'expired') {
      where.due_date = { lt: todayDate };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    if (query.teacher_id || query.subject_id || query.class_id) {
      where.teaching_assignment = {};
      if (query.teacher_id) {
        where.teaching_assignment.teacher_id = BigInt(query.teacher_id);
      }
      if (query.subject_id) {
        where.teaching_assignment.subject_id = BigInt(query.subject_id);
      }
      if (query.class_id) {
        where.class_section = {
          class_id: BigInt(query.class_id),
        };
      }
    }

    const total = await this.prisma.assignment.count({ where });
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const sortField = query.sort_by === 'assigned_date' ? 'assigned_date' : 'due_date';
    const sortOrder = query.sort_order === 'desc' ? 'desc' : 'asc';

    const assignments = await this.prisma.assignment.findMany({
      where,
      include: {
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
        teaching_assignment: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        creator: true,
      },
      orderBy: [{ [sortField]: sortOrder }, { id: 'asc' }],
      skip,
      take: perPage,
    });

    // Group hierarchically: Class -> Section -> Assignments
    const classMap = new Map<number, any>();

    for (const a of assignments) {
      const classId = Number(a.class_section.class.id);
      const className = a.class_section.class.name;
      const gradeLevel = a.class_section.class.grade_level;
      const sectionId = Number(a.class_section.id);
      const sectionName = a.class_section.section.name;

      if (!classMap.has(classId)) {
        classMap.set(classId, {
          class_id: classId,
          class_name: className,
          grade_level: gradeLevel,
          sectionsMap: new Map<number, any>(),
        });
      }

      const classObj = classMap.get(classId);
      if (!classObj.sectionsMap.has(sectionId)) {
        classObj.sectionsMap.set(sectionId, {
          class_section_id: sectionId,
          section_name: sectionName,
          assignments: [],
        });
      }

      const sectionObj = classObj.sectionsMap.get(sectionId);

      const aDueDate = new Date(a.due_date);
      const aStatus = aDueDate >= todayDate ? 'active' : 'expired';
      const attachments = (a.attachments as any[]) || [];

      sectionObj.assignments.push({
        id: Number(a.id),
        teaching_assignment_id: Number(a.teaching_assignment_id),
        subject_id: Number(a.teaching_assignment.subject.id),
        subject_name: a.teaching_assignment.subject.name,
        teacher_id: Number(a.teaching_assignment.teacher.id),
        teacher_name: a.teaching_assignment.teacher.full_name,
        created_by_user_id: Number(a.created_by_user_id),
        creator_name: a.creator.user_code,
        creator_role: a.creator.role_type,
        title: a.title,
        description: a.description,
        assigned_date: a.assigned_date.toISOString().slice(0, 10),
        due_date: a.due_date.toISOString().slice(0, 10),
        status: aStatus,
        attachments_count: attachments.length,
        attachments,
        created_at: a.created_at.toISOString(),
        updated_at: a.updated_at ? a.updated_at.toISOString() : null,
      });
    }

    const classesArray = Array.from(classMap.values()).map((c) => ({
      class_id: c.class_id,
      class_name: c.class_name,
      grade_level: c.grade_level,
      sections: Array.from(c.sectionsMap.values()),
    }));

    return {
      success: true,
      message: 'تم جلب مصفوفة الواجبات المدرسية بنجاح.',
      data: {
        academic_year_id: Number(year.id),
        academic_year_name: year.name,
        academic_term_id: term ? Number(term.id) : null,
        academic_term_name: term ? term.name : '',
        classes: classesArray,
      },
      meta: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  /**
   * 1.2 GET /api/v1/assignments/:id
   * Get single assignment full details
   */
  async findById(id: number, currentUser?: any) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: BigInt(id), deleted_at: null },
      include: {
        academic_year: true,
        academic_term: true,
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
        teaching_assignment: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        creator: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('الواجب المدرسي غير موجود.');
    }

    // Role scoping check for students & parents
    if (currentUser?.role_type === RoleType.student) {
      const student = await this.prisma.student.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (student) {
        const enrollment = await this.prisma.studentEnrollment.findFirst({
          where: {
            student_id: student.id,
            academic_year_id: assignment.academic_year_id,
            class_section_id: assignment.class_section_id,
            deleted_at: null,
          },
        });
        if (!enrollment) {
          throw new ForbiddenException('غير مصرح لك باستعراض تفاصيل هذا الواجب.');
        }
      }
    } else if (currentUser?.role_type === RoleType.parent) {
      const guardian = await this.prisma.guardian.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (guardian) {
        const links = await this.prisma.guardianStudent.findMany({
          where: { guardian_id: guardian.id, deleted_at: null },
        });
        const studentIds = links.map((l) => l.student_id);
        const enrollment = await this.prisma.studentEnrollment.findFirst({
          where: {
            student_id: { in: studentIds },
            academic_year_id: assignment.academic_year_id,
            class_section_id: assignment.class_section_id,
            deleted_at: null,
          },
        });
        if (!enrollment) {
          throw new ForbiddenException('غير مصرح لك باستعراض تفاصيل هذا الواجب.');
        }
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const aStatus =
      assignment.due_date >= new Date(todayStr) ? 'active' : 'expired';
    const attachments = (assignment.attachments as any[]) || [];

    return {
      success: true,
      message: 'تم جلب تفاصيل الواجب المدرسي بنجاح.',
      data: {
        id: Number(assignment.id),
        academic_year_id: Number(assignment.academic_year_id),
        academic_year_name: assignment.academic_year.name,
        academic_term_id: Number(assignment.academic_term_id),
        academic_term_name: assignment.academic_term.name,
        class_id: Number(assignment.class_section.class.id),
        class_name: assignment.class_section.class.name,
        class_section_id: Number(assignment.class_section_id),
        section_name: assignment.class_section.section.name,
        teaching_assignment_id: Number(assignment.teaching_assignment_id),
        subject_id: Number(assignment.teaching_assignment.subject.id),
        subject_name: assignment.teaching_assignment.subject.name,
        teacher_id: Number(assignment.teaching_assignment.teacher.id),
        teacher_name: assignment.teaching_assignment.teacher.full_name,
        created_by_user_id: Number(assignment.created_by_user_id),
        creator_name: assignment.creator.user_code,
        creator_role: assignment.creator.role_type,
        title: assignment.title,
        description: assignment.description,
        assigned_date: assignment.assigned_date.toISOString().slice(0, 10),
        due_date: assignment.due_date.toISOString().slice(0, 10),
        status: aStatus,
        attachments,
        created_at: assignment.created_at.toISOString(),
        updated_at: assignment.updated_at
          ? assignment.updated_at.toISOString()
          : null,
      },
    };
  }

  /**
   * 1.3 POST /api/v1/assignments
   * Create assignment
   */
  async create(
    dto: CreateAssignmentDto,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const assignedDate = new Date(dto.assigned_date);
    const dueDate = new Date(dto.due_date);

    if (dueDate < assignedDate) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'فشل التحقق من صحة البيانات.',
        errors: {
          due_date: ['تاريخ الاستحقاق لا يمكن أن يكون سابقاً لتاريخ التكليف.'],
        },
      });
    }

    // Role check: if teacher, ensure they own the teaching_assignment
    if (currentUser?.role_type === RoleType.teacher) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (!teacher) {
        throw new ForbiddenException(
          'غير مصرح لك بنشر واجب لشعبة أو مادة غير موكلة إليك.',
        );
      }

      const teachingAssignment =
        await this.prisma.teachingAssignment.findFirst({
          where: {
            id: BigInt(dto.teaching_assignment_id),
            teacher_id: teacher.id,
            class_section_id: BigInt(dto.class_section_id),
            deleted_at: null,
          },
        });

      if (!teachingAssignment) {
        throw new ForbiddenException(
          'غير مصرح لك بنشر واجب لشعبة أو مادة غير موكلة إليك.',
        );
      }
    }

    const created = await this.prisma.assignment.create({
      data: {
        academic_year_id: BigInt(dto.academic_year_id),
        academic_term_id: BigInt(dto.academic_term_id),
        class_section_id: BigInt(dto.class_section_id),
        teaching_assignment_id: BigInt(dto.teaching_assignment_id),
        created_by_user_id: BigInt(currentUser.id),
        title: dto.title,
        description: dto.description || null,
        attachments: dto.attachments || [],
        assigned_date: assignedDate,
        due_date: dueDate,
      },
      include: {
        teaching_assignment: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
        creator: true,
      },
    });

    await this.auditService.log({
      userId: BigInt(currentUser.id),
      action: 'ASSIGNMENT_CREATED',
      entityType: 'assignments',
      entityId: created.id,
      oldValues: null,
      newValues: {
        title: created.title,
        class_section_id: Number(created.class_section_id),
        due_date: dto.due_date,
      },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    const attachments = (created.attachments as any[]) || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const aStatus =
      created.due_date >= new Date(todayStr) ? 'active' : 'expired';

    return {
      success: true,
      message: 'تم إنشاء ونشر الواجب المدرسي بنجاح.',
      data: {
        id: Number(created.id),
        academic_year_id: Number(created.academic_year_id),
        academic_term_id: Number(created.academic_term_id),
        class_section_id: Number(created.class_section_id),
        teaching_assignment_id: Number(created.teaching_assignment_id),
        subject_name: created.teaching_assignment.subject.name,
        teacher_name: created.teaching_assignment.teacher.full_name,
        title: created.title,
        description: created.description,
        assigned_date: created.assigned_date.toISOString().slice(0, 10),
        due_date: created.due_date.toISOString().slice(0, 10),
        status: aStatus,
        attachments,
        created_at: created.created_at.toISOString(),
      },
    };
  }

  /**
   * 1.4 PUT /api/v1/assignments/:id
   * Update assignment
   */
  async update(
    id: number,
    dto: UpdateAssignmentDto,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: BigInt(id), deleted_at: null },
      include: {
        teaching_assignment: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('الواجب المدرسي غير موجود.');
    }

    // Permissions check
    if (currentUser?.role_type === RoleType.teacher) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      const isCreator = assignment.created_by_user_id === BigInt(currentUser.id);
      const isAssigned =
        teacher && assignment.teaching_assignment.teacher_id === teacher.id;

      if (!isCreator && !isAssigned) {
        throw new ForbiddenException(
          'غير مصرح لك بتعديل واجب لشعبة أو مادة غير موكلة إليك.',
        );
      }
    } else if (currentUser?.role_type !== RoleType.admin) {
      throw new ForbiddenException(
        'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      );
    }

    const assignedDate = dto.assigned_date
      ? new Date(dto.assigned_date)
      : assignment.assigned_date;
    const dueDate = dto.due_date ? new Date(dto.due_date) : assignment.due_date;

    if (dueDate < assignedDate) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'فشل التحقق من صحة البيانات.',
        errors: {
          due_date: ['تاريخ الاستحقاق لا يمكن أن يكون سابقاً لتاريخ التكليف.'],
        },
      });
    }

    const updateData: any = {};
    if (dto.academic_year_id !== undefined)
      updateData.academic_year_id = BigInt(dto.academic_year_id);
    if (dto.academic_term_id !== undefined)
      updateData.academic_term_id = BigInt(dto.academic_term_id);
    if (dto.class_section_id !== undefined)
      updateData.class_section_id = BigInt(dto.class_section_id);
    if (dto.teaching_assignment_id !== undefined)
      updateData.teaching_assignment_id = BigInt(dto.teaching_assignment_id);
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.attachments !== undefined) updateData.attachments = dto.attachments;
    if (dto.assigned_date !== undefined) updateData.assigned_date = assignedDate;
    if (dto.due_date !== undefined) updateData.due_date = dueDate;

    const updated = await this.prisma.assignment.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        teaching_assignment: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        creator: true,
      },
    });

    await this.auditService.log({
      userId: BigInt(currentUser.id),
      action: 'ASSIGNMENT_UPDATED',
      entityType: 'assignments',
      entityId: updated.id,
      oldValues: {
        title: assignment.title,
        due_date: assignment.due_date.toISOString().slice(0, 10),
      },
      newValues: {
        title: updated.title,
        due_date: updated.due_date.toISOString().slice(0, 10),
      },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    const attachments = (updated.attachments as any[]) || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const aStatus =
      updated.due_date >= new Date(todayStr) ? 'active' : 'expired';

    return {
      success: true,
      message: 'تم تحديث بيانات الواجب المدرسي بنجاح.',
      data: {
        id: Number(updated.id),
        academic_year_id: Number(updated.academic_year_id),
        academic_term_id: Number(updated.academic_term_id),
        class_section_id: Number(updated.class_section_id),
        teaching_assignment_id: Number(updated.teaching_assignment_id),
        subject_name: updated.teaching_assignment.subject.name,
        teacher_name: updated.teaching_assignment.teacher.full_name,
        title: updated.title,
        description: updated.description,
        assigned_date: updated.assigned_date.toISOString().slice(0, 10),
        due_date: updated.due_date.toISOString().slice(0, 10),
        status: aStatus,
        attachments,
        updated_at: updated.updated_at
          ? updated.updated_at.toISOString()
          : null,
      },
    };
  }

  /**
   * 1.5 DELETE /api/v1/assignments/:id
   * Soft delete assignment
   */
  async delete(
    id: number,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: BigInt(id), deleted_at: null },
      include: {
        teaching_assignment: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('الواجب المدرسي غير موجود.');
    }

    if (currentUser?.role_type === RoleType.teacher) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      const isCreator = assignment.created_by_user_id === BigInt(currentUser.id);
      const isAssigned =
        teacher && assignment.teaching_assignment.teacher_id === teacher.id;

      if (!isCreator && !isAssigned) {
        throw new ForbiddenException(
          'غير مصرح لك بحذف واجب لشعبة أو مادة غير موكلة إليك.',
        );
      }
    } else if (currentUser?.role_type !== RoleType.admin) {
      throw new ForbiddenException(
        'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      );
    }

    await this.prisma.assignment.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });

    await this.auditService.log({
      userId: BigInt(currentUser.id),
      action: 'ASSIGNMENT_DELETED',
      entityType: 'assignments',
      entityId: BigInt(id),
      oldValues: { title: assignment.title },
      newValues: { deleted_at: new Date().toISOString() },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return {
      success: true,
      message: 'تم حذف وإلغاء الواجب المدرسي بنجاح.',
    };
  }
}
