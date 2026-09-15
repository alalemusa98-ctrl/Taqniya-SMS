import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { CreateOfficialExamDto } from './dto/create-official-exam.dto.js';
import { UpdateOfficialExamDto } from './dto/update-official-exam.dto.js';
import { QueryOfficialExamsDto } from './dto/query-official-exams.dto.js';
import { ExamType, RoleType } from '@prisma/client';

@Injectable()
export class OfficialExamsService {
  constructor(private readonly prisma: PrismaService) {}

  private getExamTypeArabic(type: ExamType): string {
    switch (type) {
      case ExamType.midterm:
        return 'امتحان نصفي';
      case ExamType.final:
        return 'امتحان نهائي';
      case ExamType.second_round:
        return 'دور ثانٍ';
      default:
        return type;
    }
  }

  private getDayNameArabic(date: Date | string): string {
    const d = new Date(date);
    const days = [
      'الأحد',
      'الإثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
    ];
    return days[d.getDay()] || '';
  }

  /**
   * 1.1 GET /api/v1/official-exams
   * List with filtering, pagination, and hierarchical grouped view
   */
  async findAll(query: QueryOfficialExamsDto) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.academic_year_id) {
      where.academic_year_id = BigInt(query.academic_year_id);
    }
    if (query.academic_term_id) {
      where.academic_term_id = BigInt(query.academic_term_id);
    }
    if (query.class_id) {
      where.class_id = BigInt(query.class_id);
    }
    if (query.subject_id) {
      where.subject_id = BigInt(query.subject_id);
    }
    if (query.exam_type) {
      where.exam_type = query.exam_type;
    }
    if (query.exam_date) {
      where.exam_date = new Date(query.exam_date);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (query.status === 'upcoming') {
      where.exam_date = { ...(where.exam_date || {}), gte: today };
    } else if (query.status === 'completed') {
      where.exam_date = { ...(where.exam_date || {}), lt: today };
    }

    if (query.search) {
      where.OR = [
        {
          notes: {
            contains: query.search,
          },
        },
        {
          subject: {
            name: {
              contains: query.search,
            },
          },
        },
        {
          class: {
            name: {
              contains: query.search,
            },
          },
        },
      ];
    }

    // Filter by teacher's assigned subjects/classes if requested
    if (query.teacher_id) {
      const assignments = await this.prisma.teachingAssignment.findMany({
        where: {
          teacher_id: BigInt(query.teacher_id),
          deleted_at: null,
        },
        include: {
          class_section: true,
        },
      });

      const allowedClassIds = Array.from(
        new Set(assignments.map((a) => a.class_section.class_id)),
      );
      const allowedSubjectIds = Array.from(
        new Set(assignments.map((a) => a.subject_id)),
      );

      if (allowedClassIds.length === 0 || allowedSubjectIds.length === 0) {
        return {
          success: true,
          message: 'تم جلب جدول الامتحانات الرسمية بنجاح.',
          data: {
            classes: [],
            items: [],
          },
          meta: {
            total: 0,
            current_page: page,
            per_page: perPage,
            last_page: 1,
          },
        };
      }

      where.class_id = { in: allowedClassIds };
      where.subject_id = { in: allowedSubjectIds };
    }

    const total = await this.prisma.officialExam.count({ where });
    const lastPage = Math.ceil(total / perPage) || 1;

    // Fetch IDs first to avoid memory sort buffer issues
    const orderBy: any = {};
    if (query.sort_by === 'exam_date') {
      orderBy.exam_date = query.sort_order || 'asc';
    } else if (query.sort_by === 'created_at') {
      orderBy.created_at = query.sort_order || 'asc';
    } else {
      orderBy.id = query.sort_order || 'asc';
    }

    const idRows = await this.prisma.officialExam.findMany({
      where,
      select: { id: true },
      orderBy,
      skip,
      take: perPage,
    });

    const ids = idRows.map((r) => r.id);

    const examsRaw = ids.length
      ? await this.prisma.officialExam.findMany({
          where: { id: { in: ids } },
          include: {
            academic_year: true,
            academic_term: true,
            class: true,
            subject: true,
          },
        })
      : [];

    const examMap = new Map(examsRaw.map((e) => [e.id.toString(), e]));
    const exams = ids.map((id) => examMap.get(id.toString())!).filter(Boolean);

    const formattedItems = exams.map((exam) => {
      const attachments = (exam.attachments as any[]) || [];
      const examDateObj = new Date(exam.exam_date);
      examDateObj.setHours(0, 0, 0, 0);
      const isUpcoming = examDateObj >= today;

      return {
        id: Number(exam.id),
        academic_year_id: Number(exam.academic_year_id),
        academic_year_name: exam.academic_year?.name || '',
        academic_term_id: Number(exam.academic_term_id),
        academic_term_name: exam.academic_term?.name || '',
        class_id: Number(exam.class_id),
        class_name: exam.class?.name || '',
        grade_level: exam.class?.grade_level || 1,
        subject_id: Number(exam.subject_id),
        subject_name: exam.subject?.name || '',
        subject_code: exam.subject?.code || '',
        exam_type: exam.exam_type,
        exam_type_ar: this.getExamTypeArabic(exam.exam_type),
        exam_date: exam.exam_date.toISOString().split('T')[0],
        exam_day_name: this.getDayNameArabic(exam.exam_date),
        status: isUpcoming ? 'upcoming' : 'completed',
        notes: exam.notes,
        attachments_count: attachments.length,
        attachments,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
      };
    });

    // Build hierarchical grouping by class and exam_type matching routes.md SSoT
    const classMap = new Map<number, any>();

    for (const item of formattedItems) {
      if (!classMap.has(item.class_id)) {
        classMap.set(item.class_id, {
          class_id: item.class_id,
          class_name: item.class_name,
          grade_level: item.grade_level,
          exam_types_map: new Map<string, any>(),
        });
      }

      const classGroup = classMap.get(item.class_id);
      if (!classGroup.exam_types_map.has(item.exam_type)) {
        classGroup.exam_types_map.set(item.exam_type, {
          exam_type: item.exam_type,
          exam_type_ar: item.exam_type_ar,
          total_subjects: 0,
          subjects: [],
          // Keep count & exams for backward compatibility with frontend
          count: 0,
          exams: [],
        });
      }

      const examTypeGroup = classGroup.exam_types_map.get(item.exam_type);
      examTypeGroup.total_subjects += 1;
      examTypeGroup.count += 1;
      examTypeGroup.subjects.push({
        id: item.id,
        subject_id: item.subject_id,
        subject_name: item.subject_name,
        exam_date: item.exam_date,
        attachments_count: item.attachments_count,
        created_at: item.created_at,
      });
      examTypeGroup.exams.push(item);
    }

    const classesArray = Array.from(classMap.values()).map((cg) => ({
      class_id: cg.class_id,
      class_name: cg.class_name,
      grade_level: cg.grade_level,
      exam_types: Array.from(cg.exam_types_map.values()),
    }));

    return {
      success: true,
      message: 'تم جلب جدول الامتحانات الرسمية بنجاح.',
      data: {
        academic_year_id: exams[0] ? Number(exams[0].academic_year_id) : null,
        academic_year_name: exams[0]?.academic_year?.name || null,
        academic_term_id: exams[0] ? Number(exams[0].academic_term_id) : null,
        academic_term_name: exams[0]?.academic_term?.name || null,
        classes: classesArray,
        items: formattedItems,
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
   * 1.2 GET /api/v1/official-exams/:id
   */
  async findById(id: number) {
    const exam = await this.prisma.officialExam.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        academic_year: true,
        academic_term: true,
        class: true,
        subject: true,
      },
    });

    if (!exam) {
      throw new NotFoundException(
        'سجل الامتحان الرسمي المطلوب غير موجود أو تم حذفه.',
      );
    }

    const attachments = (exam.attachments as any[]) || [];

    return {
      success: true,
      message: 'تم استرجاع تفاصيل الامتحان الرسمي والمرفقات بنجاح.',
      data: {
        id: Number(exam.id),
        academic_year_id: Number(exam.academic_year_id),
        academic_year_name: exam.academic_year?.name || '',
        academic_term_id: Number(exam.academic_term_id),
        academic_term_name: exam.academic_term?.name || '',
        term_name: exam.academic_term?.name || '',
        class_id: Number(exam.class_id),
        class_name: exam.class?.name || '',
        grade_level: exam.class?.grade_level || 1,
        subject_id: Number(exam.subject_id),
        subject_name: exam.subject?.name || '',
        subject_code: exam.subject?.code || '',
        exam_type: exam.exam_type,
        exam_type_ar: this.getExamTypeArabic(exam.exam_type),
        exam_date: exam.exam_date.toISOString().split('T')[0],
        exam_day_name: this.getDayNameArabic(exam.exam_date),
        notes: exam.notes,
        attachments_count: attachments.length,
        attachments,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
      },
    };
  }

  /**
   * 1.3 GET /api/v1/classes/:class_id/official-exams
   * Class exams timetable grouped by exam type (Student/Parent View)
   */
  async findByClass(classId: number, termId?: number) {
    const targetClass = await this.prisma.class.findFirst({
      where: {
        id: BigInt(classId),
        deleted_at: null,
      },
    });

    if (!targetClass) {
      throw new NotFoundException('الصف الدراسي المطلوب غير موجود.');
    }

    const where: any = {
      class_id: BigInt(classId),
      deleted_at: null,
    };

    if (termId) {
      where.academic_term_id = BigInt(termId);
    }

    const idRecords = await this.prisma.officialExam.findMany({
      where,
      select: { id: true },
      orderBy: [{ exam_date: 'asc' }, { id: 'asc' }],
    });

    const targetIds = idRecords.map((r) => r.id);

    const examsRaw = targetIds.length
      ? await this.prisma.officialExam.findMany({
          where: { id: { in: targetIds } },
          include: {
            academic_year: true,
            academic_term: true,
            subject: true,
          },
        })
      : [];

    const examMap = new Map(examsRaw.map((e) => [e.id.toString(), e]));
    const exams = targetIds.map((id) => examMap.get(id.toString())!).filter(Boolean);

    const examTypesMap = new Map<string, any>();

    for (const exam of exams) {
      const attachments = (exam.attachments as any[]) || [];
      const item = {
        id: Number(exam.id),
        subject_id: Number(exam.subject_id),
        subject_name: exam.subject.name,
        subject_code: exam.subject.code,
        exam_date: exam.exam_date.toISOString().split('T')[0],
        exam_day_name: this.getDayNameArabic(exam.exam_date),
        notes: exam.notes,
        attachments_count: attachments.length,
        attachments,
      };

      if (!examTypesMap.has(exam.exam_type)) {
        examTypesMap.set(exam.exam_type, {
          exam_type: exam.exam_type,
          exam_type_ar: this.getExamTypeArabic(exam.exam_type),
          total_exams: 0,
          count: 0,
          exams: [],
        });
      }

      const group = examTypesMap.get(exam.exam_type);
      group.total_exams += 1;
      group.count += 1;
      group.exams.push(item);
    }

    return {
      success: true,
      message: 'تم جلب جدول امتحانات الصف الدراسي بنجاح.',
      data: {
        class_id: Number(targetClass.id),
        class_name: targetClass.name,
        grade_level: targetClass.grade_level,
        academic_term_id: exams[0] ? Number(exams[0].academic_term_id) : null,
        academic_term_name: exams[0]?.academic_term?.name || null,
        academic_year_name: exams[0]?.academic_year?.name || null,
        exam_types: Array.from(examTypesMap.values()),
      },
    };
  }

  /**
   * 1.4 GET /api/v1/teachers/:teacher_id/official-exams
   * Teacher's assigned subjects exam schedule
   */
  async findByTeacher(teacherId: number, termId?: number, currentUser?: any) {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id: BigInt(teacherId),
        deleted_at: null,
      },
    });

    if (!teacher) {
      throw new NotFoundException('المعلم المطلوب غير موجود.');
    }

    // Role check: if teacher, must be own profile
    if (
      currentUser &&
      currentUser.role_type === RoleType.teacher &&
      currentUser.id !== Number(teacher.user_id)
    ) {
      throw new ForbiddenException(
        'ليس لديك الصلاحية لاستعراض جدول امتحانات معلم آخر.',
      );
    }

    // Find teacher's assigned subjects and classes
    const assignments = await this.prisma.teachingAssignment.findMany({
      where: {
        teacher_id: BigInt(teacherId),
        deleted_at: null,
      },
      include: {
        class_section: true,
      },
    });

    const allowedClassIds = Array.from(
      new Set(assignments.map((a) => a.class_section.class_id)),
    );
    const allowedSubjectIds = Array.from(
      new Set(assignments.map((a) => a.subject_id)),
    );

    if (allowedClassIds.length === 0 || allowedSubjectIds.length === 0) {
      return {
        success: true,
        message: 'تم جلب جدول الامتحانات الرسمية لمواد المعلم بنجاح.',
        data: {
          teacher_id: Number(teacher.id),
          teacher_name: teacher.full_name,
          total_exams: 0,
          exams: [],
        },
      };
    }

    const where: any = {
      class_id: { in: allowedClassIds },
      subject_id: { in: allowedSubjectIds },
      deleted_at: null,
    };

    if (termId) {
      where.academic_term_id = BigInt(termId);
    }

    const idRecords = await this.prisma.officialExam.findMany({
      where,
      select: { id: true },
      orderBy: [{ exam_date: 'asc' }, { id: 'asc' }],
    });

    const targetIds = idRecords.map((r) => r.id);

    const examsRaw = targetIds.length
      ? await this.prisma.officialExam.findMany({
          where: { id: { in: targetIds } },
          include: {
            academic_year: true,
            academic_term: true,
            class: true,
            subject: true,
          },
        })
      : [];

    const examMap = new Map(examsRaw.map((e) => [e.id.toString(), e]));
    const exams = targetIds.map((id) => examMap.get(id.toString())!).filter(Boolean);

    const formattedExams = exams.map((exam) => {
      const attachments = (exam.attachments as any[]) || [];
      return {
        id: Number(exam.id),
        academic_year_name: exam.academic_year.name,
        academic_term_name: exam.academic_term.name,
        class_id: Number(exam.class_id),
        class_name: exam.class.name,
        subject_id: Number(exam.subject_id),
        subject_name: exam.subject.name,
        subject_code: exam.subject.code,
        exam_type: exam.exam_type,
        exam_type_ar: this.getExamTypeArabic(exam.exam_type),
        exam_date: exam.exam_date.toISOString().split('T')[0],
        exam_day_name: this.getDayNameArabic(exam.exam_date),
        notes: exam.notes,
        attachments_count: attachments.length,
        attachments,
      };
    });

    return {
      success: true,
      message: 'تم جلب جدول الامتحانات الرسمية لمواد المعلم بنجاح.',
      data: {
        teacher_id: Number(teacher.id),
        teacher_name: teacher.full_name,
        total_exams: formattedExams.length,
        exams: formattedExams,
      },
    };
  }

  /**
   * 1.5 POST /api/v1/official-exams
   * Create and schedule new official exam
   */
  async create(
    dto: CreateOfficialExamDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Verify existence of relations
    const [year, term, targetClass, subject] = await Promise.all([
      this.prisma.academicYear.findFirst({
        where: { id: BigInt(dto.academic_year_id), deleted_at: null },
      }),
      this.prisma.academicTerm.findFirst({
        where: { id: BigInt(dto.academic_term_id), deleted_at: null },
      }),
      this.prisma.class.findFirst({
        where: { id: BigInt(dto.class_id), deleted_at: null },
      }),
      this.prisma.subject.findFirst({
        where: { id: BigInt(dto.subject_id), deleted_at: null },
      }),
    ]);

    if (!year) throw new NotFoundException('العام الدراسي المحدد غير موجود.');
    if (!term) throw new NotFoundException('الفصل الدراسي المحدد غير موجود.');
    if (!targetClass)
      throw new NotFoundException('الصف الدراسي المحدد غير موجود.');
    if (!subject) throw new NotFoundException('المادة الدراسية المحددة غير موجودة.');

    // 2. Invariant Check: uq_official_exam_schedule
    const existing = await this.prisma.officialExam.findFirst({
      where: {
        academic_year_id: BigInt(dto.academic_year_id),
        academic_term_id: BigInt(dto.academic_term_id),
        class_id: BigInt(dto.class_id),
        subject_id: BigInt(dto.subject_id),
        exam_type: dto.exam_type,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'يوجد امتحان رسمي مجدول مسبقاً لنفس المادة والصف الدراسي في هذا الفصل الدراسي ونفس النوع.',
      );
    }

    // 3. Create exam
    const exam = await this.prisma.officialExam.create({
      data: {
        academic_year_id: BigInt(dto.academic_year_id),
        academic_term_id: BigInt(dto.academic_term_id),
        class_id: BigInt(dto.class_id),
        subject_id: BigInt(dto.subject_id),
        exam_type: dto.exam_type,
        exam_date: new Date(dto.exam_date),
        notes: dto.notes || null,
        attachments: dto.attachments ? (dto.attachments as any) : null,
      },
      include: {
        academic_year: true,
        academic_term: true,
        class: true,
        subject: true,
      },
    });

    // 4. Audit Log
    await this.prisma.auditLog.create({
      data: {
        user_id: BigInt(userId),
        action: 'create',
        entity_type: 'OfficialExam',
        entity_id: exam.id,
        new_values: {
          id: Number(exam.id),
          class_id: Number(exam.class_id),
          subject_id: Number(exam.subject_id),
          exam_type: exam.exam_type,
          exam_date: dto.exam_date,
        },
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      },
    });

    const attachments = (exam.attachments as any[]) || [];

    return {
      success: true,
      message: 'تمت جدولة الامتحان الرسمي وحفظ المرفقات بنجاح.',
      data: {
        id: Number(exam.id),
        academic_year_id: Number(exam.academic_year_id),
        academic_year_name: exam.academic_year.name,
        academic_term_id: Number(exam.academic_term_id),
        academic_term_name: exam.academic_term.name,
        term_name: exam.academic_term.name,
        class_id: Number(exam.class_id),
        class_name: exam.class.name,
        subject_id: Number(exam.subject_id),
        subject_name: exam.subject.name,
        exam_type: exam.exam_type,
        exam_type_ar: this.getExamTypeArabic(exam.exam_type),
        exam_date: exam.exam_date.toISOString().split('T')[0],
        exam_day_name: this.getDayNameArabic(exam.exam_date),
        notes: exam.notes,
        attachments_count: attachments.length,
        attachments,
        created_at: exam.created_at,
      },
    };
  }

  /**
   * 1.6 PUT /api/v1/official-exams/:id
   * Update official exam schedule and attachments
   */
  async update(
    id: number,
    dto: UpdateOfficialExamDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.officialExam.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'سجل الامتحان الرسمي المطلوب غير موجود أو تم حذفه.',
      );
    }

    const yearId = dto.academic_year_id
      ? BigInt(dto.academic_year_id)
      : existing.academic_year_id;
    const termId = dto.academic_term_id
      ? BigInt(dto.academic_term_id)
      : existing.academic_term_id;
    const classId = dto.class_id ? BigInt(dto.class_id) : existing.class_id;
    const subjectId = dto.subject_id
      ? BigInt(dto.subject_id)
      : existing.subject_id;
    const examType = dto.exam_type ? dto.exam_type : existing.exam_type;

    // Check unique conflict if composite key changed
    if (
      dto.academic_year_id ||
      dto.academic_term_id ||
      dto.class_id ||
      dto.subject_id ||
      dto.exam_type
    ) {
      const duplicate = await this.prisma.officialExam.findFirst({
        where: {
          academic_year_id: yearId,
          academic_term_id: termId,
          class_id: classId,
          subject_id: subjectId,
          exam_type: examType,
          id: { not: BigInt(id) },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'يوجد امتحان رسمي آخر مجدول بنفس المادة والصف الدراسي في هذا الفصل الدراسي ونفس النوع.',
        );
      }
    }

    const updated = await this.prisma.officialExam.update({
      where: { id: BigInt(id) },
      data: {
        academic_year_id: yearId,
        academic_term_id: termId,
        class_id: classId,
        subject_id: subjectId,
        exam_type: examType,
        exam_date: dto.exam_date ? new Date(dto.exam_date) : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        attachments:
          dto.attachments !== undefined
            ? (dto.attachments as any)
            : undefined,
      },
      include: {
        academic_year: true,
        academic_term: true,
        class: true,
        subject: true,
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        user_id: BigInt(userId),
        action: 'update',
        entity_type: 'OfficialExam',
        entity_id: updated.id,
        old_values: {
          exam_date: existing.exam_date.toISOString().split('T')[0],
          notes: existing.notes,
        },
        new_values: {
          exam_date: updated.exam_date.toISOString().split('T')[0],
          notes: updated.notes,
        },
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      },
    });

    const attachments = (updated.attachments as any[]) || [];

    return {
      success: true,
      message: 'تم تحديث بيانات ومرفقات الامتحان الرسمي بنجاح.',
      data: {
        id: Number(updated.id),
        academic_year_id: Number(updated.academic_year_id),
        academic_year_name: updated.academic_year.name,
        academic_term_id: Number(updated.academic_term_id),
        academic_term_name: updated.academic_term.name,
        term_name: updated.academic_term.name,
        class_id: Number(updated.class_id),
        class_name: updated.class.name,
        subject_id: Number(updated.subject_id),
        subject_name: updated.subject.name,
        exam_type: updated.exam_type,
        exam_type_ar: this.getExamTypeArabic(updated.exam_type),
        exam_date: updated.exam_date.toISOString().split('T')[0],
        exam_day_name: this.getDayNameArabic(updated.exam_date),
        notes: updated.notes,
        attachments_count: attachments.length,
        attachments,
        updated_at: updated.updated_at,
      },
    };
  }

  /**
   * 1.7 DELETE /api/v1/official-exams/:id
   * Soft delete official exam
   */
  async delete(
    id: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.officialExam.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'سجل الامتحان الرسمي المطلوب غير موجود أو تم حذفه.',
      );
    }

    await this.prisma.officialExam.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: BigInt(userId),
        action: 'delete',
        entity_type: 'OfficialExam',
        entity_id: BigInt(id),
        old_values: {
          id,
          class_id: Number(existing.class_id),
          subject_id: Number(existing.subject_id),
          exam_type: existing.exam_type,
        },
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      },
    });

    return {
      success: true,
      message: 'تم إلغاء وحذف الامتحان الرسمي من الجدول المعتمد بنجاح.',
    };
  }
}
