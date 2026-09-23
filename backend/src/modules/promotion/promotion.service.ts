import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { FreezeTranscriptDto } from './dto/freeze-transcript.dto.js';
import { QueryTranscriptsDto } from './dto/query-transcripts.dto.js';
import { PreviewPromotionDto } from './dto/preview-promotion.dto.js';
import { ExecutePromotionDto } from './dto/execute-promotion.dto.js';
import { RoleType, TranscriptType, EnrollmentStatus } from '@prisma/client';

@Injectable()
export class PromotionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private getTranscriptTypeArabic(type: TranscriptType): string {
    return type === TranscriptType.annual
      ? 'صحيفة سنوية نهائية'
      : 'صحيفة فصلية';
  }

  /**
   * 1.1 GET /api/v1/transcripts
   * Browse and filter archived transcripts with executive class summaries & rankings
   */
  async getTranscripts(query: QueryTranscriptsDto) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    // Resolve academic year if not provided
    let yearName = query.academic_year_name;
    if (!yearName) {
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { is_active: 1, deleted_at: null },
      });
      yearName = activeYear?.name || '';
    }

    const where: any = {
      deleted_at: null,
    };

    if (yearName) {
      where.academic_year_name = yearName;
    }

    if (query.transcript_type) {
      where.transcript_type = query.transcript_type;
    }

    if (query.grade_level !== undefined && query.grade_level !== null) {
      where.grade_level = Number(query.grade_level);
    }

    if (query.class_name) {
      where.class_name = query.class_name;
    }

    if (query.section_name) {
      where.section_name = query.section_name;
    }

    if (query.class_academic_term_id) {
      where.class_academic_term_id = BigInt(query.class_academic_term_id);
    }

    if (query.final_status) {
      where.final_status = query.final_status;
    }

    if (query.search) {
      where.OR = [
        {
          student: {
            full_name: { contains: query.search },
          },
        },
        {
          student: {
            user: {
              user_code: { contains: query.search },
            },
          },
        },
      ];
    }

    const sortField = query.sort_by || 'percentage';
    const sortOrder = query.sort_order || 'desc';
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [total, transcripts, allYearTranscripts] = await Promise.all([
      this.prisma.studentTranscript.count({ where }),
      this.prisma.studentTranscript.findMany({
        where,
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
        orderBy,
        skip,
        take: perPage,
      }),
      // Aggregate summary statistics for all classes in this year & transcript_type
      this.prisma.studentTranscript.findMany({
        where: {
          academic_year_name: yearName,
          ...(query.transcript_type ? { transcript_type: query.transcript_type } : {}),
          deleted_at: null,
        },
        select: {
          grade_level: true,
          class_name: true,
          final_status: true,
        },
      }),
    ]);

    // Build Executive Class Summaries
    const classSummaryMap = new Map<number, any>();
    for (const item of allYearTranscripts) {
      if (!classSummaryMap.has(item.grade_level)) {
        classSummaryMap.set(item.grade_level, {
          grade_level: item.grade_level,
          class_name: item.class_name,
          total_students: 0,
          passed_count: 0,
          second_round_count: 0,
          failed_count: 0,
          graduated_count: 0,
        });
      }
      const summary = classSummaryMap.get(item.grade_level);
      summary.total_students += 1;
      if (item.final_status === EnrollmentStatus.passed) summary.passed_count += 1;
      else if (item.final_status === EnrollmentStatus.second_round) summary.second_round_count += 1;
      else if (item.final_status === EnrollmentStatus.failed) summary.failed_count += 1;
      else if (item.final_status === EnrollmentStatus.graduated) summary.graduated_count += 1;
    }

    const classesSummary = Array.from(classSummaryMap.values())
      .sort((a, b) => a.grade_level - b.grade_level)
      .map((c) => {
        const passRate =
          c.total_students > 0
            ? Number(((c.passed_count / c.total_students) * 100).toFixed(2))
            : 0;
        return {
          ...c,
          pass_rate_percentage: passRate,
        };
      });

    const formattedTranscripts = transcripts.map((t, idx) => ({
      id: Number(t.id),
      student_id: Number(t.student_id),
      student_name: t.student?.full_name || '',
      student_code: t.student?.user?.user_code || '',
      class_name: t.class_name,
      section_name: t.section_name,
      grade_level: t.grade_level,
      total_score: Number(t.total_score),
      percentage: Number(t.percentage),
      final_status: t.final_status,
      rank: t.rank || (skip + idx + 1),
      created_at: t.created_at,
    }));

    const lastPage = Math.max(1, Math.ceil(total / perPage));

    return {
      success: true,
      message:
        total > 0
          ? 'تم جلب مصفوفة الصحائف المدرسية المؤرشفة بنجاح.'
          : 'لا توجد صحائف مدرسية تطابق محددات البحث.',
      data: {
        academic_year_name: yearName,
        transcript_type: query.transcript_type || TranscriptType.annual,
        transcript_type_ar: this.getTranscriptTypeArabic(
          query.transcript_type || TranscriptType.annual,
        ),
        classes_summary: classesSummary,
        transcripts: formattedTranscripts,
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
   * 1.2 GET /api/v1/transcripts/:id
   * Get complete frozen transcript details & JSON snapshot
   */
  async getTranscriptById(id: number, currentUser?: any) {
    const transcript = await this.prisma.studentTranscript.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!transcript) {
      throw new NotFoundException('سجل الصحيفة المدرسية غير موجود.');
    }

    // Role-based IDOR validation
    if (currentUser?.role_type === RoleType.student) {
      const student = await this.prisma.student.findUnique({
        where: { user_id: BigInt(currentUser.id) },
      });
      if (!student || student.id !== transcript.student_id) {
        throw new ForbiddenException('ليس لديك الصلاحية لاستعراض صحيفة طالب آخر.');
      }
    } else if (currentUser?.role_type === RoleType.parent) {
      const guardian = await this.prisma.guardian.findUnique({
        where: { user_id: BigInt(currentUser.id) },
        include: { guardian_students: true },
      });
      const hasAccess = guardian?.guardian_students.some(
        (gs) => gs.student_id === transcript.student_id,
      );
      if (!hasAccess) {
        throw new ForbiddenException('ليس لديك الصلاحية لاستعراض صحيفة طالب ليس تحت وصايتك.');
      }
    }

    return {
      success: true,
      message: 'تم استرجاع تفاصيل لقطة الصحيفة المدرسية بنجاح.',
      data: {
        id: Number(transcript.id),
        student_id: Number(transcript.student_id),
        student_name: transcript.student?.full_name || '',
        student_code: transcript.student?.user?.user_code || '',
        transcript_type: transcript.transcript_type,
        transcript_type_ar: this.getTranscriptTypeArabic(transcript.transcript_type),
        academic_year_name: transcript.academic_year_name,
        class_name: transcript.class_name,
        section_name: transcript.section_name,
        grade_level: transcript.grade_level,
        total_score: Number(transcript.total_score),
        percentage: Number(transcript.percentage),
        final_status: transcript.final_status,
        rank: transcript.rank,
        transcript_data: transcript.transcript_data,
        created_at: transcript.created_at,
      },
    };
  }

  /**
   * 1.3 GET /api/v1/students/:student_id/transcripts
   * View all historical transcripts of a specific student
   */
  async getStudentTranscripts(studentId: number, query: any, currentUser?: any) {
    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(studentId) },
      include: { user: true },
    });

    if (!student || student.deleted_at) {
      throw new NotFoundException('الطالب غير موجود.');
    }

    // IDOR Protection
    if (currentUser?.role_type === RoleType.student) {
      if (student.user_id !== BigInt(currentUser.id)) {
        throw new ForbiddenException('ليس لديك الصلاحية لاستعراض صحائف طالب آخر.');
      }
    } else if (currentUser?.role_type === RoleType.parent) {
      const guardian = await this.prisma.guardian.findUnique({
        where: { user_id: BigInt(currentUser.id) },
        include: { guardian_students: true },
      });
      const hasAccess = guardian?.guardian_students.some(
        (gs) => gs.student_id === student.id,
      );
      if (!hasAccess) {
        throw new ForbiddenException('ليس لديك الصلاحية لاستعراض صحائف طالب ليس تحت وصايتك.');
      }
    }

    const where: any = {
      student_id: BigInt(studentId),
      deleted_at: null,
    };

    if (query?.academic_year_name) {
      where.academic_year_name = query.academic_year_name;
    }

    if (query?.transcript_type) {
      where.transcript_type = query.transcript_type;
    }

    const transcripts = await this.prisma.studentTranscript.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'تم استرجاع السجل الأكاديمي التاريخي للصحائف بنجاح.',
      data: {
        student_id: Number(student.id),
        student_name: student.full_name,
        student_code: student.user?.user_code || '',
        transcripts: transcripts.map((t) => ({
          id: Number(t.id),
          transcript_type: t.transcript_type,
          transcript_type_ar: this.getTranscriptTypeArabic(t.transcript_type),
          academic_year_name: t.academic_year_name,
          class_name: t.class_name,
          section_name: t.section_name,
          percentage: Number(t.percentage),
          final_status: t.final_status,
          created_at: t.created_at,
        })),
      },
    };
  }

  /**
   * 1.4 POST /api/v1/transcripts/freeze
   * Freeze and archive official transcript with JSON snapshot
   */
  async freezeTranscript(
    dto: FreezeTranscriptDto,
    adminUserId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(dto.student_id) },
    });

    if (!student || student.deleted_at) {
      throw new NotFoundException('الطالب المحدد غير موجود.');
    }

    // Invariant: Check unique transcript constraint
    const existing = await this.prisma.studentTranscript.findFirst({
      where: {
        student_id: BigInt(dto.student_id),
        academic_year_name: dto.academic_year_name,
        transcript_type: dto.transcript_type,
        class_academic_term_id: dto.class_academic_term_id
          ? BigInt(dto.class_academic_term_id)
          : null,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'تم إصدار وتجميد صحيفة معتمدة مسبقاً لهذا الطالب بنفس النوع والفترة (uq_student_transcript_term).',
      );
    }

    const created = await this.prisma.studentTranscript.create({
      data: {
        student_id: BigInt(dto.student_id),
        transcript_type: dto.transcript_type,
        class_academic_term_id: dto.class_academic_term_id
          ? BigInt(dto.class_academic_term_id)
          : null,
        academic_year_name: dto.academic_year_name,
        class_name: dto.class_name,
        section_name: dto.section_name,
        grade_level: dto.grade_level,
        total_score: dto.total_score,
        percentage: dto.percentage,
        final_status: dto.final_status,
        rank: dto.rank,
        transcript_data: dto.transcript_data,
      },
    });

    // Audit Logging
    await this.auditService.log({
      userId: BigInt(adminUserId),
      action: 'create',
      entityType: 'student_transcripts',
      entityId: created.id,
      newValues: {
        student_id: dto.student_id,
        transcript_type: dto.transcript_type,
        academic_year_name: dto.academic_year_name,
        final_status: dto.final_status,
        total_score: dto.total_score,
        percentage: dto.percentage,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تجميد وإصدار الصحيفة المدرسية بنجاح.',
      data: {
        id: Number(created.id),
        student_id: Number(created.student_id),
        transcript_type: created.transcript_type,
        academic_year_name: created.academic_year_name,
        final_status: created.final_status,
        created_at: created.created_at,
      },
    };
  }

  /**
   * 2.1 GET /api/v1/promotions/batches
   * Browse executed promotion batches history with pagination
   */
  async getPromotionBatches(page = 1, perPage = 15) {
    const skip = (page - 1) * perPage;

    const [total, batches] = await Promise.all([
      this.prisma.promotionBatch.count({ where: { deleted_at: null } }),
      this.prisma.promotionBatch.findMany({
        where: { deleted_at: null },
        include: {
          from_year: true,
          to_year: true,
          executor: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
    ]);

    const data = batches.map((b) => ({
      id: Number(b.id),
      from_academic_year_id: Number(b.from_academic_year_id),
      from_academic_year_name: b.from_year?.name || '',
      to_academic_year_id: Number(b.to_academic_year_id),
      to_academic_year_name: b.to_year?.name || '',
      executed_by_name: b.executor?.user_code || 'مدير النظام',
      total_students: b.total_students,
      total_promoted: b.total_promoted,
      total_second_round: b.total_second_round,
      total_retained: b.total_retained,
      total_graduated: b.total_graduated,
      overall_passing_rate: Number(b.overall_passing_rate),
      created_at: b.created_at,
    }));

    const lastPage = Math.max(1, Math.ceil(total / perPage));

    return {
      success: true,
      message: 'تم جلب سجل دفعات الترحيل بنجاح.',
      data,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: lastPage,
      },
    };
  }

  /**
   * 2.2 GET /api/v1/promotions/batches/:id
   * Get promotion batch details & statistics
   */
  async getPromotionBatchById(id: number) {
    const batch = await this.prisma.promotionBatch.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        from_year: true,
        to_year: true,
        executor: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('سجل دفعة الترحيل غير موجود.');
    }

    return {
      success: true,
      message: 'تم استرجاع تفاصيل وإحصائيات دفعة الترحيل بنجاح.',
      data: {
        id: Number(batch.id),
        from_academic_year_id: Number(batch.from_academic_year_id),
        from_academic_year_name: batch.from_year?.name || '',
        to_academic_year_id: Number(batch.to_academic_year_id),
        to_academic_year_name: batch.to_year?.name || '',
        executed_by_name: batch.executor?.user_code || 'مدير النظام',
        total_students: batch.total_students,
        total_promoted: batch.total_promoted,
        total_second_round: batch.total_second_round,
        total_retained: batch.total_retained,
        total_graduated: batch.total_graduated,
        overall_passing_rate: Number(batch.overall_passing_rate),
        class_statistics: batch.class_statistics,
        execution_notes: batch.execution_notes,
        created_at: batch.created_at,
      },
    };
  }

  /**
   * 2.3 POST /api/v1/promotions/preview
   * Simulate promotion results & generate low enrollment warnings
   */
  async previewPromotion(dto: PreviewPromotionDto) {
    const fromYear = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(dto.from_academic_year_id) },
    });
    const toYear = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(dto.to_academic_year_id) },
    });

    if (!fromYear || !toYear) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات المعاينة غير صالحة.',
        errors: {
          from_academic_year_id: ['العام الدراسي غير موجود.'],
        },
      });
    }

    // Check if promotion already executed between these years
    const existingBatch = await this.prisma.promotionBatch.findFirst({
      where: {
        from_academic_year_id: BigInt(dto.from_academic_year_id),
        to_academic_year_id: BigInt(dto.to_academic_year_id),
        deleted_at: null,
      },
    });

    if (existingBatch) {
      throw new ConflictException(
        'العام الدراسي المختار مرحل مسبقاً أو غير صالح للترحيل.',
      );
    }

    // Fetch all current enrollments in fromYear
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        academic_year_id: BigInt(dto.from_academic_year_id),
        deleted_at: null,
      },
      include: {
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });

    let totalStudents = enrollments.length;
    let toBePromoted = 0;
    let secondRound = 0;
    let retained = 0;
    let graduated = 0;

    // Track simulated section counts in target year
    const targetSectionStudents = new Map<string, { class_name: string; section_name: string; count: number }>();

    for (const e of enrollments) {
      const cls = e.class_section?.class;
      const sec = e.class_section?.section;
      const gradeLevel = cls?.grade_level || 1;

      if (e.status === EnrollmentStatus.passed) {
        if (gradeLevel >= 12) {
          graduated += 1;
        } else {
          toBePromoted += 1;
          const targetClassName = `الصف ${gradeLevel + 1}`;
          const targetSecName = sec?.name || 'شعبة أ';
          const key = `${targetClassName} - ${targetSecName}`;
          if (!targetSectionStudents.has(key)) {
            targetSectionStudents.set(key, { class_name: targetClassName, section_name: targetSecName, count: 0 });
          }
          targetSectionStudents.get(key)!.count += 1;
        }
      } else if (e.status === EnrollmentStatus.second_round) {
        secondRound += 1;
      } else if (e.status === EnrollmentStatus.failed) {
        retained += 1;
        const currentClassName = cls?.name || `الصف ${gradeLevel}`;
        const currentSecName = sec?.name || 'شعبة أ';
        const key = `${currentClassName} - ${currentSecName}`;
        if (!targetSectionStudents.has(key)) {
          targetSectionStudents.set(key, { class_name: currentClassName, section_name: currentSecName, count: 0 });
        }
        targetSectionStudents.get(key)!.count += 1;
      }
    }

    // Generate mapping examples
    const mappingExamples: any[] = [];
    const lowEnrollmentWarnings: any[] = [];

    for (const [key, val] of targetSectionStudents.entries()) {
      mappingExamples.push({
        target: key,
        students_count: val.count,
      });

      if (val.count > 0 && val.count < 10) {
        lowEnrollmentWarnings.push({
          class_name: val.class_name,
          section_name: val.section_name,
          students_count: val.count,
          warning_message: `الشعبة (${val.class_name}/${val.section_name}) تحتوي على عدد طلاب منخفض جداً (${val.count} طلاب - أقل من الحد الأدنى المقترح 10 طلاب). تتيح المنظومة خيار الإبقاء أو الدمج اليدوي.`,
        });
      }
    }

    return {
      success: true,
      message: 'تم معاينة نتائج الترحيل وتوليد تنبيهات الشعب بنجاح.',
      data: {
        summary: {
          total_students: totalStudents,
          to_be_promoted: toBePromoted,
          second_round: secondRound,
          retained: retained,
          graduated: graduated,
        },
        promotion_mapping_examples: mappingExamples.slice(0, 10),
        low_enrollment_warnings: lowEnrollmentWarnings,
      },
    };
  }

  /**
   * 2.4 POST /api/v1/promotions/execute
   * Execute atomic batch promotion & section continuity assignment
   */
  async executePromotion(
    dto: ExecutePromotionDto,
    adminUserId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const fromYear = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(dto.from_academic_year_id) },
    });
    const toYear = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(dto.to_academic_year_id) },
    });

    if (!fromYear || !toYear) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'فشل التحقق من مدخلات تنفيذ الترحيل الجماعي.',
        errors: {
          from_academic_year_id: ['العام الدراسي المرحل منه أو إليه غير موجود.'],
        },
      });
    }

    // Check unique constraint
    const existing = await this.prisma.promotionBatch.findFirst({
      where: {
        from_academic_year_id: BigInt(dto.from_academic_year_id),
        to_academic_year_id: BigInt(dto.to_academic_year_id),
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'تم تنفيذ دفعة ترحيل معتمدة مسبقاً بين هذين العامين (uq_promotion_batch_years).',
      );
    }

    // Fetch existing enrollments
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        academic_year_id: BigInt(dto.from_academic_year_id),
        deleted_at: null,
      },
      include: {
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'لا يوجد طلاب مسكنين في العام الدراسي المحدد لتنفيذ الترحيل.',
      });
    }

    // Fetch target year classes and sections
    const targetClasses = await this.prisma.class.findMany({
      where: { deleted_at: null },
      include: {
        class_sections: {
          where: { deleted_at: null },
          include: { section: true },
        },
      },
    });

    // Execute within an ACID Database Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      let totalPromoted = 0;
      let totalSecondRound = 0;
      let totalRetained = 0;
      let totalGraduated = 0;
      const classStatsMap = new Map<string, { class_name: string; total: number; promoted: number; retained: number }>();

      for (const e of enrollments) {
        const cls = e.class_section?.class;
        const sec = e.class_section?.section;
        const currentGrade = cls?.grade_level || 1;
        const className = cls?.name || `الصف ${currentGrade}`;

        if (!classStatsMap.has(className)) {
          classStatsMap.set(className, { class_name: className, total: 0, promoted: 0, retained: 0 });
        }
        const stat = classStatsMap.get(className)!;
        stat.total += 1;

        if (e.status === EnrollmentStatus.passed) {
          if (currentGrade >= 12) {
            totalGraduated += 1;
            // Mark graduated
            await tx.studentEnrollment.update({
              where: { id: e.id },
              data: { status: EnrollmentStatus.graduated },
            });
          } else {
            totalPromoted += 1;
            stat.promoted += 1;
            const targetGrade = currentGrade + 1;
            const targetClass = targetClasses.find((c) => c.grade_level === targetGrade);
            const targetClassSection = targetClass?.class_sections.find(
              (cs) => cs.section.name === sec?.name,
            ) || targetClass?.class_sections[0];

            if (targetClassSection && targetClass) {
              await tx.studentEnrollment.create({
                data: {
                  student_id: e.student_id,
                  academic_year_id: BigInt(dto.to_academic_year_id),
                  class_id: targetClass.id,
                  grade_level: targetGrade,
                  class_section_id: targetClassSection.id,
                  status: EnrollmentStatus.enrolled,
                },
              });
            }
          }
        } else if (e.status === EnrollmentStatus.second_round) {
          totalSecondRound += 1;
        } else if (e.status === EnrollmentStatus.failed) {
          totalRetained += 1;
          stat.retained += 1;
          // Retained in same grade
          const targetClass = targetClasses.find((c) => c.grade_level === currentGrade);
          const targetClassSection = targetClass?.class_sections.find(
            (cs) => cs.section.name === sec?.name,
          ) || targetClass?.class_sections[0];

          if (targetClassSection && targetClass) {
            await tx.studentEnrollment.create({
              data: {
                student_id: e.student_id,
                academic_year_id: BigInt(dto.to_academic_year_id),
                class_id: targetClass.id,
                grade_level: currentGrade,
                class_section_id: targetClassSection.id,
                status: EnrollmentStatus.enrolled,
              },
            });
          }
        }
      }

      const totalProcessed = enrollments.length;
      const overallPassingRate =
        totalProcessed > 0
          ? Number(((totalPromoted / totalProcessed) * 100).toFixed(2))
          : 0;

      const classStatistics = Array.from(classStatsMap.values()).map((s) => ({
        ...s,
        pass_rate: s.total > 0 ? Number(((s.promoted / s.total) * 100).toFixed(2)) : 0,
      }));

      // Create promotion batch record
      const batch = await tx.promotionBatch.create({
        data: {
          from_academic_year_id: BigInt(dto.from_academic_year_id),
          to_academic_year_id: BigInt(dto.to_academic_year_id),
          executed_by_user_id: BigInt(adminUserId),
          total_students: totalProcessed,
          total_promoted: totalPromoted,
          total_second_round: totalSecondRound,
          total_retained: totalRetained,
          total_graduated: totalGraduated,
          overall_passing_rate: overallPassingRate,
          class_statistics: classStatistics,
          execution_notes: dto.execution_notes || 'تم الترحيل السنوي بنجاح.',
        },
      });

      return batch;
    });

    // Audit Logging
    await this.auditService.log({
      userId: BigInt(adminUserId),
      action: 'promote',
      entityType: 'promotion_batches',
      entityId: result.id,
      newValues: {
        from_year_id: dto.from_academic_year_id,
        to_year_id: dto.to_academic_year_id,
        total_students: result.total_students,
        total_promoted: result.total_promoted,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تنفيذ واكتمال عملية الترحيل الأكاديمي الجماعي بنجاح.',
      data: {
        batch_id: Number(result.id),
        total_processed: result.total_students,
        executed_at: result.created_at,
      },
    };
  }
}
