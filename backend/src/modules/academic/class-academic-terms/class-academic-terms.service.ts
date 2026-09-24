import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateClassAcademicTermDto } from './dto/create-class-academic-term.dto.js';
import { UpdateClassAcademicTermDto } from './dto/update-class-academic-term.dto.js';
import { QueryClassAcademicTermsDto } from './dto/query-class-academic-terms.dto.js';

@Injectable()
export class ClassAcademicTermsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeClassTerm(item: any) {
    return {
      id: Number(item.id),
      class_id: Number(item.class_id),
      class_name: item.class ? item.class.name : undefined,
      academic_term_id: Number(item.academic_term_id),
      term_name: item.academic_term ? item.academic_term.name : undefined,
      is_active: Number(item.is_active),
      is_closed: Number(item.is_closed),
    };
  }

  async checkActivation(id: number) {
    const target = await this.prisma.classAcademicTerm.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class: true,
        academic_term: true,
      },
    });

    if (!target) {
      throw new NotFoundException('تخصيص فترة الصف غير موجود.');
    }

    if (target.is_active === 1) {
      return {
        success: true,
        can_activate: true,
        is_already_active: true,
        has_previous_term: false,
        message: 'هذا الفصل الدراسي نشط بالفعل لهذا الصف.',
        data: {
          target_term_id: Number(target.id),
          target_term_name: target.academic_term?.name || `فصل ${target.academic_term_id}`,
          class_id: Number(target.class_id),
          class_name: target.class?.name,
          total_students: 0,
          completed_students: 0,
          missing_count: 0,
          missing_students: [],
        },
      };
    }

    const currentActive = await this.prisma.classAcademicTerm.findFirst({
      where: {
        class_id: target.class_id,
        is_active: 1,
        deleted_at: null,
      },
      include: {
        academic_term: true,
      },
    });

    if (!currentActive) {
      return {
        success: true,
        can_activate: true,
        has_previous_term: false,
        message: 'لا يوجد فصل دراسي نشط سابق. يمكن تفعيل الفصل مباشرة.',
        data: {
          target_term_id: Number(target.id),
          target_term_name: target.academic_term?.name || `فصل ${target.academic_term_id}`,
          class_id: Number(target.class_id),
          class_name: target.class?.name,
          total_students: 0,
          completed_students: 0,
          missing_count: 0,
          missing_students: [],
        },
      };
    }

    const activeYear = await this.prisma.academicYear.findFirst({
      where: { is_active: 1, deleted_at: null },
    });

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        class_section: { class_id: target.class_id },
        deleted_at: null,
        ...(activeYear ? { academic_year_id: activeYear.id } : {}),
      },
      include: {
        student: true,
        class_section: { include: { section: true } },
      },
    });

    const totalStudents = enrollments.length;
    const previousTermName = currentActive.academic_term?.name || `الفصل ${currentActive.academic_term_id}`;

    if (totalStudents === 0) {
      return {
        success: true,
        can_activate: true,
        has_previous_term: true,
        previous_term_name: previousTermName,
        previous_term_id: Number(currentActive.id),
        message: `تم التحقق بنجاح (لا يوجد طلاب مسجلين في هذا الصف بعد). يمكن تفعيل ${target.academic_term?.name || 'الفصل'}.`,
        data: {
          target_term_id: Number(target.id),
          target_term_name: target.academic_term?.name || `فصل ${target.academic_term_id}`,
          previous_term_id: Number(currentActive.id),
          previous_term_name: previousTermName,
          class_id: Number(target.class_id),
          class_name: target.class?.name,
          total_students: 0,
          completed_students: 0,
          missing_count: 0,
          missing_students: [],
        },
      };
    }

    const studentIds = enrollments.map((e) => e.student_id);
    const transcripts = await this.prisma.studentTranscript.findMany({
      where: {
        student_id: { in: studentIds },
        academic_year_name: activeYear?.name,
        deleted_at: null,
        OR: [
          { class_academic_term_id: currentActive.id },
          { class_academic_term: { academic_term_id: currentActive.academic_term_id } },
        ],
      },
      select: {
        student_id: true,
      },
    });

    const gradedStudentIds = new Set(transcripts.map((t) => Number(t.student_id)));
    const missingStudents = enrollments
      .filter((e) => !gradedStudentIds.has(Number(e.student_id)))
      .map((e) => ({
        student_id: Number(e.student_id),
        student_name: e.student?.full_name || `طالب #${e.student_id}`,
        student_code: `STD-${e.student_id}`,
        section_name: e.class_section?.section?.name || 'الشعبة العامة',
        class_section_id: Number(e.class_section_id),
      }));

    const missingCount = missingStudents.length;
    const completedCount = totalStudents - missingCount;

    if (missingCount > 0) {
      return {
        success: true,
        can_activate: false,
        has_previous_term: true,
        previous_term_name: previousTermName,
        previous_term_id: Number(currentActive.id),
        message: `لا يمكن تفعيل "${target.academic_term?.name}" لوجود ${missingCount} طالب من أصل ${totalStudents} لم يتم استكمال رصد درجاتهم في الفصل النشط السابق ("${previousTermName}").`,
        data: {
          target_term_id: Number(target.id),
          target_term_name: target.academic_term?.name || `فصل ${target.academic_term_id}`,
          previous_term_id: Number(currentActive.id),
          previous_term_name: previousTermName,
          class_id: Number(target.class_id),
          class_name: target.class?.name,
          total_students: totalStudents,
          completed_students: completedCount,
          missing_count: missingCount,
          missing_students: missingStudents,
        },
      };
    }

    return {
      success: true,
      can_activate: true,
      has_previous_term: true,
      previous_term_name: previousTermName,
      previous_term_id: Number(currentActive.id),
      message: `تم التحقق بنجاح من اكتمال رصد كافة درجات الطلاب (${totalStudents} طالب) للفصل السابق ("${previousTermName}"). كل شيء مكتمل وجاهز للتفعيل.`,
      data: {
        target_term_id: Number(target.id),
        target_term_name: target.academic_term?.name || `فصل ${target.academic_term_id}`,
        previous_term_id: Number(currentActive.id),
        previous_term_name: previousTermName,
        class_id: Number(target.class_id),
        class_name: target.class?.name,
        total_students: totalStudents,
        completed_students: totalStudents,
        missing_count: 0,
        missing_students: [],
      },
    };
  }

  async activate(
    id: number,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
    force = false,
  ) {
    const existing = await this.prisma.classAcademicTerm.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('تخصيص فترة الصف غير موجود.');
    }

    if (!force) {
      const check = await this.checkActivation(id);
      if (!check.can_activate) {
        throw new BadRequestException(check.message);
      }
    }

    // Atomic transaction: deactivate all other terms for this class, activate this one
    await this.prisma.$transaction([
      this.prisma.classAcademicTerm.updateMany({
        where: {
          class_id: existing.class_id,
          deleted_at: null,
        },
        data: {
          is_active: 0,
        },
      }),
      this.prisma.classAcademicTerm.update({
        where: {
          id: BigInt(id),
        },
        data: {
          is_active: 1,
        },
      }),
    ]);

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'activate',
      entityType: 'class_academic_terms',
      entityId: BigInt(id),
      newValues: { is_active: 1 },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم تفعيل الفترة النشطة للصف بنجاح.',
      data: {
        id: Number(existing.id),
        class_id: Number(existing.class_id),
        academic_term_id: Number(existing.academic_term_id),
        is_active: 1,
      },
    };
  }

  async findAll(query: QueryClassAcademicTermsDto = {}) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const classWhere: any = {
      deleted_at: null,
    };

    if (query.class_id) {
      classWhere.id = BigInt(query.class_id);
    }

    if (query.search) {
      classWhere.name = {
        contains: query.search,
      };
    }

    const termWhere: any = {
      deleted_at: null,
    };

    if (query.academic_term_id) {
      termWhere.academic_term_id = BigInt(query.academic_term_id);
    }

    if (query.is_active !== undefined) {
      termWhere.is_active = Number(query.is_active);
    }

    if (query.is_closed !== undefined) {
      termWhere.is_closed = Number(query.is_closed);
    }

    // Only get classes that have matching terms (or all classes if no term filter)
    const [totalClasses, classes] = await Promise.all([
      this.prisma.class.count({
        where: {
          ...classWhere,
          class_academic_terms: {
            some: termWhere,
          },
        },
      }),
      this.prisma.class.findMany({
        where: {
          ...classWhere,
          class_academic_terms: {
            some: termWhere,
          },
        },
        include: {
          class_academic_terms: {
            where: termWhere,
            include: {
              academic_term: true,
            },
            orderBy: {
              academic_term_id: 'asc',
            },
          },
        },
        skip,
        take: perPage,
        orderBy: {
          grade_level: 'asc',
        },
      }),
    ]);

    const formattedClasses = classes.map((c) => ({
      class_id: Number(c.id),
      class_name: c.name,
      terms: c.class_academic_terms.map((t) => ({
        id: Number(t.id),
        academic_term_id: Number(t.academic_term_id),
        term_name: t.academic_term?.name,
        is_active: Number(t.is_active),
        is_closed: Number(t.is_closed),
      })),
    }));

    const message =
      formattedClasses.length === 0
        ? 'لا توجد فترات مسجلة تطابق محددات البحث.'
        : 'تم جلب فترات وحالات صفوف المدرسة بنجاح.';

    return {
      success: true,
      message,
      data: {
        classes: formattedClasses,
      },
      meta: {
        current_page: page,
        per_page: perPage,
        total: totalClasses,
        last_page: Math.ceil(totalClasses / perPage) || 1,
      },
    };
  }

  async findOne(id: number) {
    const record = await this.prisma.classAcademicTerm.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class: true,
        academic_term: true,
      },
    });

    if (!record) {
      throw new NotFoundException('تخصيص فترة الصف غير موجود.');
    }

    return {
      success: true,
      message: 'تم جلب تفاصيل فترة الصف بنجاح.',
      data: this.serializeClassTerm(record),
    };
  }

  async create(
    dto: CreateClassAcademicTermDto,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Verify class exists
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: BigInt(dto.class_id),
        deleted_at: null,
      },
    });

    if (!classRecord) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التخصيص غير صالحة.',
        errors: { class_id: ['الصف الدراسي المحدد غير موجود.'] },
      });
    }

    // 2. Verify academic term exists
    const termRecord = await this.prisma.academicTerm.findFirst({
      where: {
        id: BigInt(dto.academic_term_id),
        deleted_at: null,
      },
    });

    if (!termRecord) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التخصيص غير صالحة.',
        errors: { academic_term_id: ['الفترة المحددة غير صالحة.'] },
      });
    }

    // 3. Check uniqueness (uq_class_term) & handle soft-delete restoration
    const existing = await this.prisma.classAcademicTerm.findFirst({
      where: {
        class_id: BigInt(dto.class_id),
        academic_term_id: BigInt(dto.academic_term_id),
      },
    });

    if (existing && !existing.deleted_at) {
      throw new ConflictException('هذه الفترة مخصصة مسبقاً لهذا الصف الدراسي (uq_class_term).');
    }

    // 4. Create or Restore record
    let created: any;
    if (existing && existing.deleted_at) {
      created = await this.prisma.classAcademicTerm.update({
        where: { id: existing.id },
        data: {
          deleted_at: null,
          is_active: 0,
          is_closed: 0,
          updated_at: new Date(),
        },
        include: {
          class: true,
          academic_term: true,
        },
      });
    } else {
      created = await this.prisma.classAcademicTerm.create({
        data: {
          class_id: BigInt(dto.class_id),
          academic_term_id: BigInt(dto.academic_term_id),
          is_active: 0,
          is_closed: 0,
        },
        include: {
          class: true,
          academic_term: true,
        },
      });
    }

    const serialized = this.serializeClassTerm(created);

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'create',
      entityType: 'class_academic_terms',
      entityId: BigInt(serialized.id),
      newValues: serialized,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم تخصيص الفترة للصف بنجاح.',
      data: serialized,
    };
  }

  async update(
    id: number,
    dto: UpdateClassAcademicTermDto,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.classAcademicTerm.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class: true,
        academic_term: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('تخصيص فترة الصف غير موجود.');
    }

    // Check lock
    if (existing.is_closed === 1) {
      throw new ConflictException(
        'لا يمكن تعديل الفترة لأنها مغلقة نهائياً للأرشفة (is_closed = 1).',
      );
    }

    const classId = dto.class_id ? BigInt(dto.class_id) : existing.class_id;
    const termId = dto.academic_term_id ? BigInt(dto.academic_term_id) : existing.academic_term_id;

    // Check uniqueness if changed
    if (termId !== existing.academic_term_id || classId !== existing.class_id) {
      const conflict = await this.prisma.classAcademicTerm.findFirst({
        where: {
          class_id: classId,
          academic_term_id: termId,
          deleted_at: null,
          NOT: { id: BigInt(id) },
        },
      });

      if (conflict) {
        throw new ConflictException('هذه الفترة مخصصة مسبقاً لهذا الصف الدراسي (uq_class_term).');
      }
    }

    const updated = await this.prisma.classAcademicTerm.update({
      where: { id: BigInt(id) },
      data: {
        class_id: classId,
        academic_term_id: termId,
      },
      include: {
        class: true,
        academic_term: true,
      },
    });

    const serialized = this.serializeClassTerm(updated);

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'update',
      entityType: 'class_academic_terms',
      entityId: BigInt(id),
      oldValues: this.serializeClassTerm(existing),
      newValues: serialized,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث فترة الصف بنجاح.',
      data: serialized,
    };
  }

  async close(
    id: number,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.classAcademicTerm.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('تخصيص فترة الصف غير موجود.');
    }

    const newClosedStatus = existing.is_closed === 1 ? 0 : 1;

    await this.prisma.classAcademicTerm.update({
      where: { id: BigInt(id) },
      data: {
        is_closed: newClosedStatus,
      },
    });

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: newClosedStatus === 1 ? 'close' : 'open',
      entityType: 'class_academic_terms',
      entityId: BigInt(id),
      oldValues: { is_closed: existing.is_closed },
      newValues: { is_closed: newClosedStatus },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم تغيير حالة إغلاق درجات الفترة للصف بنجاح.',
      data: {
        id: Number(existing.id),
        is_closed: newClosedStatus,
      },
    };
  }

  async remove(
    id: number,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.classAcademicTerm.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class_subjects: {
          where: { deleted_at: null },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('تخصيص فترة الصف غير موجود.');
    }

    if (existing.is_active === 1) {
      throw new ConflictException('لا يمكن فك ارتباط الفترة النشطة حالياً للصف الدراسي.');
    }

    if (existing.class_subjects && existing.class_subjects.length > 0) {
      throw new ConflictException(
        'لا يمكن فك ارتباط الفترة لوجود مواد مسندة بها، يرجى إزالة المواد المسندة أولاً (RESTRICT).',
      );
    }

    const now = new Date();
    await this.prisma.classAcademicTerm.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: now,
      },
    });

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'delete',
      entityType: 'class_academic_terms',
      entityId: BigInt(id),
      oldValues: this.serializeClassTerm(existing),
      newValues: { deleted_at: now },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم فك ربط الفترة من الصف بنجاح.',
    };
  }
}
