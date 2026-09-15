import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';
import { QueryQuizzesDto, QuizStatusFilter } from './dto/query-quizzes.dto.js';
import { RoleType, Prisma } from '@prisma/client';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to format Date to YYYY-MM-DD
   */
  private formatDateOnly(d: Date | string | null | undefined): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper to determine status based on quiz_date
   */
  private computeStatus(quizDate: Date | string): 'upcoming' | 'completed' {
    const todayStr = this.formatDateOnly(new Date());
    const quizDateStr = this.formatDateOnly(quizDate);
    return quizDateStr >= todayStr ? 'upcoming' : 'completed';
  }

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
   * 1.1 GET /api/v1/quizzes
   * Hierarchical list grouped by Class -> Section -> Quizzes
   */
  async findAll(query: QueryQuizzesDto, currentUser?: any) {
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
          current_page: query.page || 1,
          per_page: query.per_page || 15,
          total: 0,
          last_page: 1,
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

    // Role-based scoping
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
          where.class_section_id = BigInt(-1);
        }
      } else {
        where.class_section_id = BigInt(-1);
      }
    } else if (currentUser?.role_type === RoleType.parent) {
      const guardian = await this.prisma.guardian.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (guardian) {
        const guardianStudents = await this.prisma.guardianStudent.findMany({
          where: { guardian_id: guardian.id, deleted_at: null },
          select: { student_id: true },
        });
        const studentIds = guardianStudents.map((gs) => gs.student_id);
        const enrollments = await this.prisma.studentEnrollment.findMany({
          where: {
            student_id: { in: studentIds },
            academic_year_id: year.id,
            deleted_at: null,
          },
          select: { class_section_id: true },
        });
        const sectionIds = enrollments.map((e) => e.class_section_id);
        where.class_section_id = { in: sectionIds.length > 0 ? sectionIds : [BigInt(-1)] };
      } else {
        where.class_section_id = BigInt(-1);
      }
    }

    // Explicit section filter
    if (query.class_section_id) {
      where.class_section_id = BigInt(query.class_section_id);
    }

    // Teaching assignment filter
    if (query.teaching_assignment_id) {
      where.teaching_assignment_id = BigInt(query.teaching_assignment_id);
    }

    // Teacher or Subject filters via TeachingAssignment
    const assignmentWhere: any = { deleted_at: null };
    let hasAssignmentFilter = false;

    if (query.teacher_id) {
      assignmentWhere.teacher_id = BigInt(query.teacher_id);
      hasAssignmentFilter = true;
    }
    if (query.subject_id) {
      assignmentWhere.subject_id = BigInt(query.subject_id);
      hasAssignmentFilter = true;
    }

    if (hasAssignmentFilter) {
      const matchingAssignments = await this.prisma.teachingAssignment.findMany({
        where: assignmentWhere,
        select: { id: true },
      });
      const ids = matchingAssignments.map((a) => a.id);
      where.teaching_assignment_id = { in: ids.length > 0 ? ids : [BigInt(-1)] };
    }

    // Class filter via class_section
    if (query.class_id) {
      const sectionsInClass = await this.prisma.classSection.findMany({
        where: {
          class_id: BigInt(query.class_id),
          deleted_at: null,
        },
        select: { id: true },
      });
      const secIds = sectionsInClass.map((s) => s.id);
      if (where.class_section_id && typeof where.class_section_id === 'object' && where.class_section_id.in) {
        const intersection = where.class_section_id.in.filter((id: bigint) => secIds.includes(id));
        where.class_section_id = { in: intersection.length > 0 ? intersection : [BigInt(-1)] };
      } else if (!where.class_section_id) {
        where.class_section_id = { in: secIds.length > 0 ? secIds : [BigInt(-1)] };
      }
    }

    // Search filter in title or description
    if (query.search && query.search.trim()) {
      where.OR = [
        { title: { contains: query.search.trim() } },
        { description: { contains: query.search.trim() } },
      ];
    }

    // Exact quiz date filter
    if (query.quiz_date) {
      where.quiz_date = new Date(query.quiz_date);
    }

    // Status filter: upcoming / active vs completed / expired
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      query.status === QuizStatusFilter.upcoming ||
      query.status === QuizStatusFilter.active ||
      (query.status as any) === 'upcoming' ||
      (query.status as any) === 'active'
    ) {
      where.quiz_date = { gte: today };
    } else if (
      query.status === QuizStatusFilter.completed ||
      query.status === QuizStatusFilter.expired ||
      (query.status as any) === 'completed' ||
      (query.status as any) === 'expired'
    ) {
      where.quiz_date = { lt: today };
    }

    // Order by
    const orderBy: any = {};
    if (query.sort_by === 'id') {
      orderBy.id = query.sort_order === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.quiz_date = query.sort_order === 'desc' ? 'desc' : 'asc';
    }

    // Count total quizzes matching criteria
    const total = await this.prisma.quiz.count({ where });

    const page = query.page && query.page > 0 ? query.page : 1;
    const perPage = query.per_page && query.per_page > 0 ? query.per_page : 15;
    const skip = (page - 1) * perPage;
    const lastPage = Math.ceil(total / perPage) || 1;
    // Fetch quiz IDs first with minimal projection to prevent MySQL Sort Buffer Overflow (Error 1038) on JSON/TEXT columns
    const quizIdRecords = await this.prisma.quiz.findMany({
      where,
      select: { id: true },
      orderBy: query.sort_by === 'id'
        ? [{ id: query.sort_order === 'desc' ? 'desc' : 'asc' }]
        : [
            { quiz_date: query.sort_order === 'desc' ? 'desc' : 'asc' },
            { id: 'desc' },
          ],
      skip,
      take: perPage,
    });

    if (quizIdRecords.length === 0) {
      return {
        success: true,
        message: 'لا توجد اختبارات أو تطبيقات دورية تطابق محددات البحث.',
        data: {
          academic_year_id: Number(year.id),
          academic_year_name: year.name,
          academic_term_id: term ? Number(term.id) : null,
          academic_term_name: term ? term.name : '',
          classes: [],
        },
        meta: {
          total,
          current_page: page,
          per_page: perPage,
          last_page: lastPage,
        },
      };
    }

    const targetIds = quizIdRecords.map((r) => r.id);

    // Fetch full relationships for the target page IDs
    const quizzesRaw = await this.prisma.quiz.findMany({
      where: {
        id: { in: targetIds },
      },
      include: {
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
        teaching_assignment: {
          include: {
            teacher: true,
            subject: true,
          },
        },
      },
    });

    // Re-order quizzes according to targetIds pagination order
    const quizMap = new Map(quizzesRaw.map((q) => [q.id.toString(), q]));
    const quizzes = targetIds.map((id) => quizMap.get(id.toString())!).filter(Boolean);

    // Build hierarchical structure: Classes -> Sections -> Quizzes
    const classMap = new Map<number, any>();

    for (const q of quizzes) {
      const classId = Number(q.class_section.class.id);
      const className = q.class_section.class.name;
      const gradeLevel = q.class_section.class.grade_level;

      const sectionId = Number(q.class_section.id);
      const sectionName = q.class_section.section.name;

      let classObj = classMap.get(classId);
      if (!classObj) {
        classObj = {
          class_id: classId,
          class_name: className,
          grade_level: gradeLevel,
          sections: [],
        };
        classMap.set(classId, classObj);
      }

      let sectionObj = classObj.sections.find(
        (s: any) => s.class_section_id === sectionId,
      );
      if (!sectionObj) {
        sectionObj = {
          class_section_id: sectionId,
          section_name: sectionName,
          quizzes: [],
        };
        classObj.sections.push(sectionObj);
      }

      const attachments = Array.isArray(q.attachments) ? q.attachments : [];
      const attachmentsCount = attachments.length;

      sectionObj.quizzes.push({
        id: Number(q.id),
        subject_name: q.teaching_assignment.subject.name,
        teacher_name: q.teaching_assignment.teacher.full_name,
        title: q.title,
        attachments_count: attachmentsCount,
        quiz_date: this.formatDateOnly(q.quiz_date),
        status: this.computeStatus(q.quiz_date),
      });
    }

    const classes = Array.from(classMap.values());

    return {
      success: true,
      message: 'تم جلب مصفوفة الاختبارات والتطبيقات الدورية بنجاح.',
      data: {
        academic_year_id: Number(year.id),
        academic_year_name: year.name,
        academic_term_id: term ? Number(term.id) : null,
        academic_term_name: term ? term.name : '',
        classes,
      },
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: lastPage,
      },
    };
  }

  /**
   * 1.2 GET /api/v1/quizzes/:id
   * Get single quiz details
   */
  async findById(id: number | bigint, currentUser?: any) {
    if (!id) {
      throw new NotFoundException({
        success: false,
        message: 'الاختبار الدوري غير موجود.',
      });
    }

    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        academic_term: true,
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
        teaching_assignment: {
          include: {
            teacher: true,
            subject: true,
          },
        },
        creator: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException({
        success: false,
        message: 'الاختبار الدوري غير موجود.',
      });
    }

    const attachments = Array.isArray(quiz.attachments) ? quiz.attachments : [];

    return {
      success: true,
      message: 'تم جلب تفاصيل الاختبار الدوري بنجاح.',
      data: {
        id: Number(quiz.id),
        academic_year_id: Number(quiz.academic_year_id),
        academic_term_id: Number(quiz.academic_term_id),
        term_name: quiz.academic_term?.name || '',
        class_id: Number(quiz.class_section.class.id),
        class_name: quiz.class_section.class.name,
        class_section_id: Number(quiz.class_section.id),
        section_name: quiz.class_section.section.name,
        teaching_assignment_id: Number(quiz.teaching_assignment.id),
        subject_id: Number(quiz.teaching_assignment.subject.id),
        subject_name: quiz.teaching_assignment.subject.name,
        teacher_id: Number(quiz.teaching_assignment.teacher.id),
        teacher_name: quiz.teaching_assignment.teacher.full_name,
        created_by_user_id: Number(quiz.created_by_user_id),
        created_by_name: quiz.creator?.user_code || '',
        title: quiz.title,
        description: quiz.description || null,
        attachments,
        quiz_date: this.formatDateOnly(quiz.quiz_date),
        status: this.computeStatus(quiz.quiz_date),
        created_at: quiz.created_at ? quiz.created_at.toISOString() : null,
        updated_at: quiz.updated_at ? quiz.updated_at.toISOString() : null,
      },
    };
  }

  /**
   * 1.3 POST /api/v1/quizzes
   * Create and publish quiz
   */
  async create(
    dto: CreateQuizDto,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Validate Quiz Date
    if (!dto.quiz_date || isNaN(new Date(dto.quiz_date).getTime())) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'فشل التحقق من مدخلات الاختبار الدوري.',
        errors: {
          quiz_date: ['تاريخ إجراء الاختبار يجب أن يكون تاريخاً صالحاً ومستقبلياً.'],
        },
      });
    }
    const quizDate = new Date(dto.quiz_date);

    // 2. Resolve Teaching Assignment
    const teachingAssignment = await this.prisma.teachingAssignment.findUnique({
      where: { id: BigInt(dto.teaching_assignment_id) },
      include: {
        class_section: true,
        academic_year: true,
        teacher: true,
        subject: true,
      },
    });

    if (!teachingAssignment || teachingAssignment.deleted_at !== null) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'فشل التحقق من مدخلات الاختبار الدوري.',
        errors: {
          teaching_assignment_id: ['إسناد التدريس المختار غير موجود أو ملغي.'],
        },
      });
    }

    // 3. Scoped RBAC for Teacher
    if (currentUser?.role_type === RoleType.teacher) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (!teacher || teacher.id !== teachingAssignment.teacher_id) {
        throw new ForbiddenException({
          success: false,
          message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
        });
      }
    }

    // 4. Resolve Academic Year and Section
    const academicYearId = dto.academic_year_id
      ? BigInt(dto.academic_year_id)
      : teachingAssignment.academic_year_id;
    const classSectionId = dto.class_section_id
      ? BigInt(dto.class_section_id)
      : teachingAssignment.class_section_id;

    // 5. Resolve Academic Term ID
    let targetTermId: bigint | null = null;
    if (dto.academic_term_id) {
      const termCheck = await this.prisma.academicTerm.findUnique({
        where: { id: BigInt(dto.academic_term_id) },
      });
      if (termCheck && termCheck.deleted_at === null) {
        targetTermId = termCheck.id;
      }
    }
    if (!targetTermId) {
      const defaultTerm = await this.prisma.academicTerm.findFirst({
        where: { deleted_at: null },
        orderBy: { id: 'asc' },
      });
      if (defaultTerm) {
        targetTermId = defaultTerm.id;
      } else {
        throw new UnprocessableEntityException({
          success: false,
          message: 'فشل التحقق من مدخلات الاختبار الدوري.',
          errors: {
            academic_term_id: ['لا يوجد فصل دراسي متاح في المنظومة.'],
          },
        });
      }
    }

    // Create Quiz
    const created = await this.prisma.quiz.create({
      data: {
        academic_year_id: academicYearId,
        academic_term_id: targetTermId,
        class_section_id: classSectionId,
        teaching_assignment_id: teachingAssignment.id,
        created_by_user_id: BigInt(currentUser.id),
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        attachments: dto.attachments && dto.attachments.length > 0 ? (dto.attachments as any) : undefined,
        quiz_date: quizDate,
      },
    });

    // Audit Log
    await this.auditService.log({
      userId: BigInt(currentUser.id),
      action: 'QUIZ_CREATED',
      entityType: 'quizzes',
      entityId: created.id,
      newValues: {
        id: Number(created.id),
        title: created.title,
        quiz_date: this.formatDateOnly(created.quiz_date),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم جدولة ونشر الاختبار الدوري بنجاح.',
      data: {
        id: Number(created.id),
        academic_year_id: Number(created.academic_year_id),
        academic_term_id: Number(created.academic_term_id),
        class_section_id: Number(created.class_section_id),
        teaching_assignment_id: Number(created.teaching_assignment_id),
        created_by_user_id: Number(created.created_by_user_id),
        title: created.title,
        description: created.description || null,
        attachments: created.attachments || [],
        quiz_date: this.formatDateOnly(created.quiz_date),
        created_at: created.created_at ? created.created_at.toISOString() : null,
      },
    };
  }

  /**
   * 1.4 PUT /api/v1/quizzes/:id
   * Update quiz details and date
   */
  async update(
    id: number | bigint,
    dto: UpdateQuizDto,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!id) {
      throw new NotFoundException({
        success: false,
        message: 'الاختبار الدوري غير موجود.',
      });
    }

    const existing = await this.prisma.quiz.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        teaching_assignment: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'الاختبار الدوري غير موجود.',
      });
    }

    // Role verification
    if (currentUser?.role_type === RoleType.teacher) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      const isCreator = existing.created_by_user_id === BigInt(currentUser.id);
      const isAssigned = teacher && existing.teaching_assignment.teacher_id === teacher.id;

      if (!isCreator && !isAssigned) {
        throw new ForbiddenException({
          success: false,
          message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
        });
      }
    } else if (currentUser?.role_type !== RoleType.admin) {
      throw new ForbiddenException({
        success: false,
        message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      });
    }

    const dataToUpdate: any = {};

    if (dto.title !== undefined) {
      dataToUpdate.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description ? dto.description.trim() : null;
    }
    if (dto.attachments !== undefined) {
      dataToUpdate.attachments = dto.attachments && dto.attachments.length > 0 ? (dto.attachments as any) : Prisma.JsonNull;
    }
    if (dto.quiz_date !== undefined) {
      const d = new Date(dto.quiz_date);
      if (isNaN(d.getTime())) {
        throw new UnprocessableEntityException({
          success: false,
          message: 'فشل التحقق من مدخلات الاختبار الدوري.',
          errors: {
            quiz_date: ['تاريخ إجراء الاختبار يجب أن يكون تاريخاً صالحاً ومستقبلياً.'],
          },
        });
      }
      dataToUpdate.quiz_date = d;
    }

    if (dto.teaching_assignment_id !== undefined || dto.class_section_id !== undefined) {
      const sectionId = dto.class_section_id ? BigInt(dto.class_section_id) : existing.class_section_id;
      const assignmentId = dto.teaching_assignment_id ? BigInt(dto.teaching_assignment_id) : existing.teaching_assignment_id;

      const assignment = await this.prisma.teachingAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment || assignment.deleted_at || assignment.class_section_id !== sectionId) {
        throw new UnprocessableEntityException({
          success: false,
          message: 'فشل التحقق من مدخلات الاختبار الدوري.',
          errors: {
            teaching_assignment_id: ['إسناد التدريس المختار غير صالح للشعبة المحددة.'],
          },
        });
      }

      if (dto.teaching_assignment_id) dataToUpdate.teaching_assignment_id = assignmentId;
      if (dto.class_section_id) dataToUpdate.class_section_id = sectionId;
    }

    const updated = await this.prisma.quiz.update({
      where: { id: BigInt(id) },
      data: dataToUpdate,
    });

    // Audit Log
    await this.auditService.log({
      userId: BigInt(currentUser.id),
      action: 'QUIZ_UPDATED',
      entityType: 'quizzes',
      entityId: updated.id,
      oldValues: {
        id: Number(existing.id),
        title: existing.title,
        quiz_date: this.formatDateOnly(existing.quiz_date),
      },
      newValues: {
        id: Number(updated.id),
        title: updated.title,
        quiz_date: this.formatDateOnly(updated.quiz_date),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث موعد وتفاصيل الاختبار الدوري بنجاح.',
      data: {
        id: Number(updated.id),
        academic_year_id: Number(updated.academic_year_id),
        academic_term_id: Number(updated.academic_term_id),
        class_section_id: Number(updated.class_section_id),
        teaching_assignment_id: Number(updated.teaching_assignment_id),
        title: updated.title,
        description: updated.description || null,
        attachments: updated.attachments || [],
        quiz_date: this.formatDateOnly(updated.quiz_date),
        updated_at: updated.updated_at ? updated.updated_at.toISOString() : null,
      },
    };
  }

  /**
   * 1.5 DELETE /api/v1/quizzes/:id
   * Soft delete quiz
   */
  async delete(
    id: number | bigint,
    currentUser: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!id) {
      throw new NotFoundException({
        success: false,
        message: 'الاختبار الدوري غير موجود.',
      });
    }

    const existing = await this.prisma.quiz.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        teaching_assignment: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'الاختبار الدوري غير موجود.',
      });
    }

    // Role verification
    if (currentUser?.role_type === RoleType.teacher) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      const isCreator = existing.created_by_user_id === BigInt(currentUser.id);
      const isAssigned = teacher && existing.teaching_assignment.teacher_id === teacher.id;

      if (!isCreator && !isAssigned) {
        throw new ForbiddenException({
          success: false,
          message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
        });
      }
    } else if (currentUser?.role_type !== RoleType.admin) {
      throw new ForbiddenException({
        success: false,
        message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      });
    }

    await this.prisma.quiz.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });

    // Audit Log
    await this.auditService.log({
      userId: BigInt(currentUser.id),
      action: 'QUIZ_DELETED',
      entityType: 'quizzes',
      entityId: existing.id,
      oldValues: {
        id: Number(existing.id),
        title: existing.title,
        quiz_date: this.formatDateOnly(existing.quiz_date),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم حذف الاختبار الدوري بنجاح.',
    };
  }
}
