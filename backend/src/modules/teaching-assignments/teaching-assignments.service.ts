import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateTeachingAssignmentDto } from './dto/create-teaching-assignment.dto.js';
import { UpdateTeachingAssignmentDto } from './dto/update-teaching-assignment.dto.js';
import { FindTeachingAssignmentsQueryDto } from './dto/find-teaching-assignments-query.dto.js';

@Injectable()
export class TeachingAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper: Resolve active academic year or validate given academic_year_id
   */
  private async resolveAcademicYear(academicYearId?: number) {
    if (academicYearId) {
      const year = await this.prisma.academicYear.findFirst({
        where: { id: BigInt(academicYearId), deleted_at: null },
      });
      if (!year) {
        throw new NotFoundException('العام الدراسي المحدد غير موجود.');
      }
      return year;
    }

    // Default to active academic year or latest
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { is_active: 1, deleted_at: null },
      orderBy: { id: 'desc' },
    });

    if (!activeYear) {
      const latest = await this.prisma.academicYear.findFirst({
        where: { deleted_at: null },
        orderBy: { id: 'desc' },
      });
      if (!latest) {
        throw new NotFoundException('لا يوجد أي عام دراسي مسجل في المنظومة.');
      }
      return latest;
    }

    return activeYear;
  }

  /**
   * 1.1 GET /api/v1/teaching-assignments
   * Hierarchical list grouped by classes -> sections -> assignments with pagination meta
   */
  async findAll(query: FindTeachingAssignmentsQueryDto) {
    const page = Math.max(1, Number(query.page || 1));
    const perPage = Math.max(1, Number(query.per_page || 15));

    // Resolve academic year
    const targetYear = await this.resolveAcademicYear(query.academic_year_id);
    const targetYearId = targetYear.id;

    // Build assignment query conditions
    const assignmentWhere: any = {
      academic_year_id: targetYearId,
      deleted_at: null,
    };

    if (query.teacher_id) {
      assignmentWhere.teacher_id = BigInt(query.teacher_id);
    }
    if (query.subject_id) {
      assignmentWhere.subject_id = BigInt(query.subject_id);
    }
    if (query.class_section_id) {
      assignmentWhere.class_section_id = BigInt(query.class_section_id);
    }

    // Fetch all active assignments for this year matching filters
    const assignments = await this.prisma.teachingAssignment.findMany({
      where: assignmentWhere,
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
      },
      orderBy: [{ class_section_id: 'asc' }, { id: 'asc' }],
    });

    // Also fetch all classes and sections in scope to present complete hierarchy
    const classWhere: any = { deleted_at: null };
    if (query.class_id) {
      classWhere.id = BigInt(query.class_id);
    }

    const allClasses = await this.prisma.class.findMany({
      where: classWhere,
      include: {
        class_sections: {
          where: { deleted_at: null },
          include: {
            section: true,
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { grade_level: 'asc' },
    });

    // Map into hierarchical structure: classes -> sections -> assignments
    const searchLower = (query.search || '').trim().toLowerCase();

    const hierarchicalClasses: any[] = [];

    for (const cls of allClasses) {
      const classIdNum = Number(cls.id);
      const matchedSections: any[] = [];

      for (const cs of cls.class_sections) {
        const secIdNum = Number(cs.id);
        const sectionName = cs.section ? cs.section.name : '';

        if (query.class_section_id && secIdNum !== Number(query.class_section_id)) {
          continue;
        }

        // Filter assignments belonging to this section
        const secAssignments = assignments
          .filter((a) => Number(a.class_section_id) === secIdNum)
          .map((a) => ({
            id: Number(a.id),
            subject_id: Number(a.subject_id),
            subject_name: a.subject.name,
            subject_code: a.subject.code,
            teacher_id: Number(a.teacher_id),
            teacher_code: a.teacher.user ? a.teacher.user.user_code : '',
            teacher_name: a.teacher.full_name,
          }));

        // Search text matching (teacher name, class name, section name, subject name)
        let includeSection = true;
        let filteredSecAssignments = secAssignments;

        if (searchLower) {
          filteredSecAssignments = secAssignments.filter(
            (a) =>
              a.teacher_name.toLowerCase().includes(searchLower) ||
              a.subject_name.toLowerCase().includes(searchLower) ||
              (a.subject_code || '').toLowerCase().includes(searchLower) ||
              a.teacher_code.toLowerCase().includes(searchLower) ||
              cls.name.toLowerCase().includes(searchLower) ||
              sectionName.toLowerCase().includes(searchLower),
          );

          if (
            filteredSecAssignments.length === 0 &&
            !cls.name.toLowerCase().includes(searchLower) &&
            !sectionName.toLowerCase().includes(searchLower)
          ) {
            includeSection = false;
          }
        }

        if (includeSection) {
          matchedSections.push({
            class_section_id: secIdNum,
            section_name: sectionName,
            assignments: filteredSecAssignments,
          });
        }
      }

      if (matchedSections.length > 0 || (!query.class_section_id && !searchLower && !query.teacher_id && !query.subject_id)) {
        hierarchicalClasses.push({
          class_id: classIdNum,
          class_name: cls.name,
          sections: matchedSections,
        });
      }
    }

    // Pagination over classes
    const totalClasses = hierarchicalClasses.length;
    const lastPage = Math.max(1, Math.ceil(totalClasses / perPage));
    const paginatedClasses = hierarchicalClasses.slice((page - 1) * perPage, page * perPage);

    return {
      success: true,
      message:
        paginatedClasses.length > 0
          ? 'تم جلب توزيع الكادر التعليمي على المواد والشعب بنجاح.'
          : 'لا توجد إسنادات تدريس مسجلة تطابق محددات البحث.',
      data: {
        academic_year_id: Number(targetYear.id),
        academic_year_name: targetYear.name,
        classes: paginatedClasses,
      },
      meta: {
        current_page: page,
        per_page: perPage,
        total: totalClasses,
        last_page: lastPage,
      },
    };
  }

  /**
   * 1.2 GET /api/v1/teachers/:teacher_id/assignments
   * Workload view for specific teacher
   */
  async findTeacherAssignments(
    teacherId: number,
    query: { academic_year_id?: number; search?: string; page?: number; per_page?: number },
    currentUser: any,
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const perPage = Math.max(1, Number(query.per_page || 15));

    // Verify teacher exists
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: BigInt(teacherId), deleted_at: null },
    });

    if (!teacher) {
      throw new NotFoundException('ملف المعلم غير موجود.');
    }

    // RBAC & IDOR check: If role is teacher, must match own user_id
    if (currentUser && currentUser.role_type === 'teacher') {
      if (Number(teacher.user_id) !== Number(currentUser.id)) {
        throw new ForbiddenException('ليس لديك الصلاحية الكافية للاطلاع على نصاب معلم آخر.');
      }
    }

    // Resolve academic year
    const targetYear = await this.resolveAcademicYear(query.academic_year_id);

    const where: any = {
      teacher_id: BigInt(teacherId),
      academic_year_id: targetYear.id,
      deleted_at: null,
    };

    const assignments = await this.prisma.teachingAssignment.findMany({
      where,
      include: {
        academic_year: true,
        subject: true,
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    let formatted = assignments.map((a) => ({
      id: Number(a.id),
      academic_year_id: Number(a.academic_year_id),
      academic_year_name: a.academic_year.name,
      class_id: Number(a.class_section.class_id),
      class_name: a.class_section.class.name,
      class_section_id: Number(a.class_section_id),
      section_name: a.class_section.section ? a.class_section.section.name : '',
      subject_id: Number(a.subject_id),
      subject_name: a.subject.name,
      subject_code: a.subject.code,
    }));

    if (query.search) {
      const q = query.search.trim().toLowerCase();
      formatted = formatted.filter(
        (item) =>
          item.class_name.toLowerCase().includes(q) ||
          item.section_name.toLowerCase().includes(q) ||
          item.subject_name.toLowerCase().includes(q) ||
          (item.subject_code || '').toLowerCase().includes(q),
      );
    }

    const total = formatted.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const paginated = formatted.slice((page - 1) * perPage, page * perPage);

    return {
      success: true,
      message: 'تم جلب النصاب الأكاديمي للمعلم بنجاح.',
      data: paginated,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: lastPage,
      },
    };
  }

  /**
   * 1.3 POST /api/v1/teaching-assignments
   * Assign teacher to subject in section
   */
  async create(dto: CreateTeachingAssignmentDto, userId: number, ipAddress?: string, userAgent?: string) {
    // 1. Resolve and verify Academic Year (specified or default to active)
    let year;
    if (dto.academic_year_id) {
      year = await this.prisma.academicYear.findFirst({
        where: { id: BigInt(dto.academic_year_id), deleted_at: null },
      });
      if (!year) {
        throw new UnprocessableEntityException({
          academic_year_id: ['العام الدراسي المحدد غير موجود.'],
        });
      }
    } else {
      year = await this.prisma.academicYear.findFirst({
        where: { is_active: 1, deleted_at: null },
        orderBy: { id: 'desc' },
      });
      if (!year) {
        throw new UnprocessableEntityException({
          academic_year_id: ['لا يوجد عام دراسي نشط في المنظومة.'],
        });
      }
    }
    const resolvedYearId = year.id;

    const section = await this.prisma.classSection.findFirst({
      where: { id: BigInt(dto.class_section_id), deleted_at: null },
    });
    if (!section) {
      throw new UnprocessableEntityException({
        class_section_id: ['الشعبة المحددة غير صالحة.'],
      });
    }

    const subject = await this.prisma.subject.findFirst({
      where: { id: BigInt(dto.subject_id), deleted_at: null },
    });
    if (!subject) {
      throw new UnprocessableEntityException({
        subject_id: ['المادة التعليمية المحددة غير صالحة.'],
      });
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: BigInt(dto.teacher_id), deleted_at: null },
      include: { user: true },
    });
    if (!teacher || !teacher.user || teacher.user.is_active !== 1) {
      throw new UnprocessableEntityException({
        teacher_id: ['المعلم المختار غير نشط أو غير موجود.'],
      });
    }

    // 2. Check Single Teacher Invariant (uq_teaching_assignment)
    const existing = await this.prisma.teachingAssignment.findFirst({
      where: {
        academic_year_id: resolvedYearId,
        class_section_id: BigInt(dto.class_section_id),
        subject_id: BigInt(dto.subject_id),
      },
    });

    if (existing && !existing.deleted_at) {
      throw new ConflictException(
        'تعارض في الإسناد: هذه المادة مسندة بالفعل لمعلم آخر في هذه الشعبة خلال العام الدراسي الحالي (uq_teaching_assignment).',
      );
    }

    // 3. Create or Reactivate Teaching Assignment within transaction
    const created = await this.prisma.$transaction(async (tx) => {
      return existing
        ? tx.teachingAssignment.update({
            where: { id: existing.id },
            data: {
              teacher_id: BigInt(dto.teacher_id),
              deleted_at: null,
            },
          })
        : tx.teachingAssignment.create({
            data: {
              academic_year_id: resolvedYearId,
              class_section_id: BigInt(dto.class_section_id),
              subject_id: BigInt(dto.subject_id),
              teacher_id: BigInt(dto.teacher_id),
            },
          });
    });

    // 4. Audit Log
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'TEACHING_ASSIGNMENT_CREATED',
      entityType: 'teaching_assignments',
      entityId: created.id,
      newValues: {
        academic_year_id: Number(resolvedYearId),
        class_section_id: dto.class_section_id,
        subject_id: dto.subject_id,
        teacher_id: dto.teacher_id,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم إسناد تدريس المادة للمعلم بنجاح.',
      data: {
        id: Number(created.id),
        academic_year_id: Number(created.academic_year_id),
        class_section_id: Number(created.class_section_id),
        subject_id: Number(created.subject_id),
        teacher_id: Number(created.teacher_id),
        created_at: created.created_at,
      },
    };
  }

  /**
   * 1.3 PUT /api/v1/teaching-assignments/:id
   * Reassign / Update assignment
   */
  async update(
    id: number,
    dto: UpdateTeachingAssignmentDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.teachingAssignment.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('سجل إسناد التدريس غير موجود.');
    }

    // 1. Verify existence of Teacher, Class Section, Subject, Year
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: BigInt(dto.teacher_id), deleted_at: null },
      include: { user: true },
    });
    if (!teacher || !teacher.user || teacher.user.is_active !== 1) {
      throw new UnprocessableEntityException({
        teacher_id: ['المعلم المختار غير نشط أو غير موجود.'],
      });
    }

    const section = await this.prisma.classSection.findFirst({
      where: { id: BigInt(dto.class_section_id), deleted_at: null },
    });
    if (!section) {
      throw new UnprocessableEntityException({
        class_section_id: ['الشعبة المحددة غير صالحة.'],
      });
    }

    const subject = await this.prisma.subject.findFirst({
      where: { id: BigInt(dto.subject_id), deleted_at: null },
    });
    if (!subject) {
      throw new UnprocessableEntityException({
        subject_id: ['المادة التعليمية المحددة غير صالحة.'],
      });
    }

    const targetYearId = dto.academic_year_id ? BigInt(dto.academic_year_id) : existing.academic_year_id;

    // 2. Check collision with another active assignment (excluding current record)
    const collision = await this.prisma.teachingAssignment.findFirst({
      where: {
        id: { not: BigInt(id) },
        academic_year_id: targetYearId,
        class_section_id: BigInt(dto.class_section_id),
        subject_id: BigInt(dto.subject_id),
        deleted_at: null,
      },
    });

    if (collision) {
      throw new ConflictException(
        'تعارض في الإسناد: هذه المادة مسندة بالفعل لمعلم آخر في هذه الشعبة خلال العام الدراسي الحالي (uq_teaching_assignment).',
      );
    }

    const oldValues = {
      academic_year_id: Number(existing.academic_year_id),
      class_section_id: Number(existing.class_section_id),
      subject_id: Number(existing.subject_id),
      teacher_id: Number(existing.teacher_id),
    };

    // 3. Update assignment within transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      return tx.teachingAssignment.update({
        where: { id: BigInt(id) },
        data: {
          academic_year_id: targetYearId,
          class_section_id: BigInt(dto.class_section_id),
          subject_id: BigInt(dto.subject_id),
          teacher_id: BigInt(dto.teacher_id),
        },
      });
    });

    // 4. Audit Log
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'TEACHING_ASSIGNMENT_UPDATED',
      entityType: 'teaching_assignments',
      entityId: BigInt(id),
      oldValues,
      newValues: {
        academic_year_id: Number(targetYearId),
        class_section_id: dto.class_section_id,
        subject_id: dto.subject_id,
        teacher_id: dto.teacher_id,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث وتعديل إسناد التدريس بنجاح.',
      data: {
        id: Number(updated.id),
        academic_year_id: Number(updated.academic_year_id),
        class_section_id: Number(updated.class_section_id),
        subject_id: Number(updated.subject_id),
        teacher_id: Number(updated.teacher_id),
      },
    };
  }

  /**
   * 1.4 DELETE /api/v1/teaching-assignments/:id
   * Soft delete with RESTRICT check
   */
  async delete(id: number, userId: number, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.teachingAssignment.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('سجل إسناد التدريس غير موجود.');
    }

    // Check RESTRICT constraints on linked relations (e.g. timetable slots, homework assignments, quizzes)
    const linkedSlots = await this.prisma.timetableSlot.count({
      where: { teaching_assignment_id: BigInt(id), deleted_at: null },
    });
    if (linkedSlots > 0) {
      throw new ConflictException(
        'لا يمكن فك إسناد التدريس لوجود حصص دراسية أو درجات أو واجبات مرتبطة به في المنظومة (Foreign Key Restrict).',
      );
    }

    const linkedAssignments = await this.prisma.assignment.count({
      where: { teaching_assignment_id: BigInt(id), deleted_at: null },
    });
    if (linkedAssignments > 0) {
      throw new ConflictException(
        'لا يمكن فك إسناد التدريس لوجود حصص دراسية أو درجات أو واجبات مرتبطة به في المنظومة (Foreign Key Restrict).',
      );
    }

    const linkedQuizzes = await this.prisma.quiz.count({
      where: { teaching_assignment_id: BigInt(id), deleted_at: null },
    });
    if (linkedQuizzes > 0) {
      throw new ConflictException(
        'لا يمكن فك إسناد التدريس لوجود حصص دراسية أو درجات أو واجبات مرتبطة به في المنظومة (Foreign Key Restrict).',
      );
    }

    // Soft delete within transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.teachingAssignment.update({
        where: { id: BigInt(id) },
        data: { deleted_at: new Date() },
      });
    });

    // Audit Log
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'TEACHING_ASSIGNMENT_DELETED',
      entityType: 'teaching_assignments',
      entityId: BigInt(id),
      oldValues: {
        academic_year_id: Number(existing.academic_year_id),
        class_section_id: Number(existing.class_section_id),
        subject_id: Number(existing.subject_id),
        teacher_id: Number(existing.teacher_id),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم فك وإلغاء إسناد التدريس بنجاح.',
    };
  }
}
