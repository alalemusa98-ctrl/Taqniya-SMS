import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto.js';
import { BulkEnrollDto } from './dto/bulk-enroll.dto.js';
import { FindEnrollmentsQueryDto } from './dto/find-enrollments-query.dto.js';
import { EnrollmentStatus, RoleType, Prisma } from '@prisma/client';

@Injectable()
export class StudentEnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Operation 1.1: GET /api/v1/student-enrollments
   * Returns hierarchical grouped enrollment matrix: classes -> sections -> students
   */
  async findAll(query: FindEnrollmentsQueryDto, _currentUser?: any) {
    let yearId = query.academic_year_id;
    let yearName = '';

    if (yearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: BigInt(yearId), deleted_at: null },
      });
      if (year) {
        yearName = year.name;
      }
    } else {
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { is_active: 1, deleted_at: null },
        orderBy: { id: 'desc' },
      });
      if (activeYear) {
        yearId = Number(activeYear.id);
        yearName = activeYear.name;
      }
    }

    if (!yearId) {
      return {
        success: true,
        message: 'لا توجد سجلات تسكين تطابق محددات البحث.',
        data: {
          academic_year_id: null,
          academic_year_name: '',
          classes: [],
        },
      };
    }

    // Build enrollments query filter
    const enrollmentWhere: Prisma.StudentEnrollmentWhereInput = {
      academic_year_id: BigInt(yearId),
      deleted_at: null,
    };

    if (query.class_id) {
      enrollmentWhere.class_id = BigInt(query.class_id);
    }
    if (query.class_section_id) {
      enrollmentWhere.class_section_id = BigInt(query.class_section_id);
    }
    if (query.status) {
      enrollmentWhere.status = query.status;
    }
    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim();
      enrollmentWhere.OR = [
        { seating_number: { contains: s } },
        { student: { full_name: { contains: s } } },
        { student: { user: { user_code: { contains: s } } } },
      ];
    }

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: enrollmentWhere,
      include: {
        class: true,
        class_section: {
          include: {
            section: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        { class: { grade_level: 'asc' } },
        { class_section_id: 'asc' },
        { student: { full_name: 'asc' } },
      ],
    });

    if (enrollments.length === 0) {
      return {
        success: true,
        message: 'لا توجد سجلات تسكين تطابق محددات البحث.',
        data: {
          academic_year_id: yearId,
          academic_year_name: yearName,
          classes: [],
        },
      };
    }

    // Group hierarchically: classes -> sections -> students
    const classMap = new Map<number, any>();

    for (const e of enrollments) {
      const cId = Number(e.class_id);
      if (!classMap.has(cId)) {
        classMap.set(cId, {
          class_id: cId,
          class_name: e.class.name,
          grade_level: e.grade_level,
          sectionsMap: new Map<number, any>(),
        });
      }

      const classObj = classMap.get(cId);
      const sId = Number(e.class_section_id);

      if (!classObj.sectionsMap.has(sId)) {
        classObj.sectionsMap.set(sId, {
          class_section_id: sId,
          section_name: e.class_section.section.name,
          enrolled_count: 0,
          students: [],
        });
      }

      const secObj = classObj.sectionsMap.get(sId);
      secObj.students.push({
        enrollment_id: Number(e.id),
        student_id: Number(e.student_id),
        student_code: e.student.user.user_code,
        student_name: e.student.full_name,
        seating_number: e.seating_number,
        status: e.status,
        created_at: e.created_at.toISOString(),
      });
      secObj.enrolled_count = secObj.students.length;
    }

    const classes = Array.from(classMap.values()).map((c) => ({
      class_id: c.class_id,
      class_name: c.class_name,
      grade_level: c.grade_level,
      sections: Array.from(c.sectionsMap.values()),
    }));

    return {
      success: true,
      message: 'تم جلب مصفوفة تسكين الطلاب بالصفوف والشعب بنجاح.',
      data: {
        academic_year_id: yearId,
        academic_year_name: yearName,
        classes,
      },
    };
  }

  /**
   * Fast Aggregate: GET /api/v1/student-enrollments/class-counts
   * Returns enrolled student counts grouped strictly by class_id for the active or requested academic year
   */
  async getClassCounts(academicYearId?: number) {
    let yearId = academicYearId;
    if (!yearId) {
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { is_active: 1, deleted_at: null },
        orderBy: { id: 'desc' },
      });
      if (activeYear) {
        yearId = Number(activeYear.id);
      }
    }

    if (!yearId) {
      return {
        success: true,
        data: [],
        enrolled_student_ids: [],
      };
    }

    const counts = await this.prisma.studentEnrollment.groupBy({
      by: ['class_id'],
      _count: {
        id: true,
      },
      where: {
        academic_year_id: BigInt(yearId),
        deleted_at: null,
      },
    });

    const enrolledStudents = await this.prisma.studentEnrollment.findMany({
      where: {
        academic_year_id: BigInt(yearId),
        deleted_at: null,
      },
      select: {
        student_id: true,
      },
      distinct: ['student_id'],
    });

    return {
      success: true,
      data: counts.map((c) => ({
        class_id: Number(c.class_id),
        count: c._count.id,
      })),
      enrolled_student_ids: enrolledStudents.map((e) => Number(e.student_id)),
    };
  }

  /**
   * Operation 1.2: GET /api/v1/students/:student_id/enrollments
   * Returns historical academic progression from student_transcripts and active student_enrollments
   */
  async getStudentEnrollments(studentId: number, currentUser: any) {
    // Check RBAC & Data Scoping
    if (currentUser.role_type === RoleType.student) {
      const student = await this.prisma.student.findUnique({
        where: { id: BigInt(studentId), deleted_at: null },
      });
      if (!student || Number(student.user_id) !== Number(currentUser.id)) {
        throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
      }
    } else if (currentUser.role_type === RoleType.parent) {
      const custody = await this.prisma.guardianStudent.findFirst({
        where: {
          student_id: BigInt(studentId),
          guardian: { user_id: BigInt(currentUser.id) },
          deleted_at: null,
        },
      });
      if (!custody) {
        throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
      }
    } else if (currentUser.role_type === RoleType.teacher) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { user_id: BigInt(currentUser.id), deleted_at: null },
      });
      if (!teacher) {
        throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
      }
      const taughtStudent = await this.prisma.studentEnrollment.findFirst({
        where: {
          student_id: BigInt(studentId),
          deleted_at: null,
          class_section: {
            teaching_assignments: {
              some: {
                teacher_id: teacher.id,
                deleted_at: null,
              },
            },
          },
        },
      });
      if (!taughtStudent) {
        throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
      }
    } else if (currentUser.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }

    // Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(studentId), deleted_at: null },
    });
    if (!student) {
      throw new NotFoundException('سجل الطالب أو التسكين غير موجود.');
    }

    // Read operational enrollments ordered by academic year
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        student_id: BigInt(studentId),
        deleted_at: null,
      },
      include: {
        academic_year: true,
        class: true,
        class_section: {
          include: { section: true },
        },
      },
      orderBy: { academic_year_id: 'desc' },
    });

    // Read historical transcripts for student to extract final status and percentage
    const transcripts = await this.prisma.studentTranscript.findMany({
      where: {
        student_id: BigInt(studentId),
        deleted_at: null,
      },
      orderBy: [
        { transcript_type: 'asc' }, // 'annual' comes before 'term'
        { created_at: 'desc' },
      ],
    });

    // Map transcripts by academic_year_name (preferring annual transcript)
    const transcriptMap = new Map<string, any>();
    for (const t of transcripts) {
      if (!transcriptMap.has(t.academic_year_name)) {
        transcriptMap.set(t.academic_year_name, t);
      } else if (t.transcript_type === 'annual') {
        transcriptMap.set(t.academic_year_name, t);
      }
    }

    const resultList: any[] = [];
    const processedYears = new Set<string>();

    // Map enrollments with their corresponding transcript data
    for (const e of enrollments) {
      const yearName = e.academic_year?.name || '';
      processedYears.add(yearName);
      const matchedTranscript = transcriptMap.get(yearName);

      const status = matchedTranscript?.final_status || e.status;
      const percentage = matchedTranscript?.percentage !== undefined ? Number(matchedTranscript.percentage) : null;
      const totalScore = matchedTranscript?.total_score !== undefined ? Number(matchedTranscript.total_score) : null;

      resultList.push({
        id: Number(e.id),
        academic_year_id: Number(e.academic_year_id),
        academic_year_name: yearName,
        class_name: e.class?.name || `الصف ${e.grade_level}`,
        grade_level: e.grade_level,
        section_name: e.class_section?.section?.name || '—',
        seating_number: e.seating_number || null,
        status,
        percentage,
        total_score: totalScore,
        created_at: e.created_at.toISOString(),
      });
    }

    // Include any historical transcripts from years not present in operational enrollments
    for (const t of transcripts) {
      if (!processedYears.has(t.academic_year_name)) {
        processedYears.add(t.academic_year_name);
        resultList.push({
          id: Number(t.id),
          academic_year_id: null,
          academic_year_name: t.academic_year_name,
          class_name: t.class_name,
          grade_level: t.grade_level,
          section_name: t.section_name || '—',
          seating_number: (t.transcript_data as any)?.seating_number || null,
          status: t.final_status,
          percentage: Number(t.percentage),
          total_score: Number(t.total_score),
          created_at: t.created_at.toISOString(),
        });
      }
    }

    return {
      success: true,
      message: 'تم جلب السجل التسكيني للطالب بنجاح.',
      data: resultList,
    };
  }

  /**
   * Operation 1.3 (POST): POST /api/v1/student-enrollments
   * Enrolls student into class section with uq_student_year_enrollment invariant
   */
  async create(
    dto: CreateEnrollmentDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(dto.student_id), deleted_at: null },
      include: { user: true },
    });
    if (!student) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التسكين غير صالحة.',
        errors: {
          student_id: ['الطالب المحدد غير موجود أو غير نشط.'],
        },
      });
    }

    // 2. Verify class_section exists
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: BigInt(dto.class_section_id), deleted_at: null },
      include: { class: true, section: true },
    });
    if (!classSection) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التسكين غير صالحة.',
        errors: {
          class_section_id: ['الشعبة المحددة غير صالحة أو غير موجودة.'],
        },
      });
    }

    // 3. Verify academic year exists
    const year = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(dto.academic_year_id), deleted_at: null },
    });
    if (!year) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التسكين غير صالحة.',
        errors: {
          academic_year_id: ['العام الدراسي المحدد غير صالح أو غير موجود.'],
        },
      });
    }

    // 4. Invariant: Check uq_student_year_enrollment (active enrollment in same year)
    const activeEnrollment = await this.prisma.studentEnrollment.findFirst({
      where: {
        academic_year_id: BigInt(dto.academic_year_id),
        student_id: BigInt(dto.student_id),
        deleted_at: null,
      },
    });
    if (activeEnrollment) {
      throw new ConflictException(
        'تعارض في التسكين: الطالب مسكن مسبقاً في هذا العام الدراسي في فصل أو شعبة أخرى (uq_student_year_enrollment).',
      );
    }

    // 5. Derive grade_level from class
    const gradeLevel = classSection.class.grade_level;

    // Check if soft-deleted row exists for this (academic_year_id, student_id)
    const existingDeleted = await this.prisma.studentEnrollment.findUnique({
      where: {
        academic_year_id_student_id: {
          academic_year_id: BigInt(dto.academic_year_id),
          student_id: BigInt(dto.student_id),
        },
      },
    });

    let enrollment;
    if (existingDeleted) {
      enrollment = await this.prisma.studentEnrollment.update({
        where: { id: existingDeleted.id },
        data: {
          class_id: classSection.class_id,
          grade_level: gradeLevel,
          class_section_id: BigInt(dto.class_section_id),
          seating_number: dto.seating_number ?? null,
          status: dto.status ?? EnrollmentStatus.enrolled,
          deleted_at: null,
        },
      });
    } else {
      enrollment = await this.prisma.studentEnrollment.create({
        data: {
          academic_year_id: BigInt(dto.academic_year_id),
          student_id: BigInt(dto.student_id),
          class_id: classSection.class_id,
          grade_level: gradeLevel,
          class_section_id: BigInt(dto.class_section_id),
          seating_number: dto.seating_number ?? null,
          status: dto.status ?? EnrollmentStatus.enrolled,
        },
      });
    }

    // 6. Audit Logging
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'create_student_enrollment',
      entityType: 'student_enrollments',
      entityId: enrollment.id,
      newValues: {
        student_id: dto.student_id,
        academic_year_id: dto.academic_year_id,
        class_section_id: dto.class_section_id,
        seating_number: dto.seating_number,
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم تسكين وتنسيق الطالب بالفصل والشعبة بنجاح.',
      data: {
        id: Number(enrollment.id),
        academic_year_id: Number(enrollment.academic_year_id),
        student_id: Number(enrollment.student_id),
        student_code: student.user.user_code,
        student_name: student.full_name,
        class_id: Number(classSection.class_id),
        class_name: classSection.class.name,
        grade_level: gradeLevel,
        class_section_id: Number(classSection.id),
        section_name: classSection.section.name,
        seating_number: enrollment.seating_number,
        status: enrollment.status,
        created_at: enrollment.created_at.toISOString(),
      },
    };
  }

  /**
   * Operation 1.3 (PUT): PUT /api/v1/student-enrollments/:id
   * Updates enrollment: transfers section, updates seating number or status
   */
  async update(
    id: number,
    dto: UpdateEnrollmentDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.studentEnrollment.findUnique({
      where: { id: BigInt(id), deleted_at: null },
      include: {
        class_section: {
          include: { section: true },
        },
      },
    });

    if (!current) {
      throw new NotFoundException('سجل التسكين غير موجود.');
    }

    const updateData: Prisma.StudentEnrollmentUpdateInput = {};
    let sectionName = current.class_section.section.name;

    if (dto.class_section_id && dto.class_section_id !== Number(current.class_section_id)) {
      const newSection = await this.prisma.classSection.findUnique({
        where: { id: BigInt(dto.class_section_id), deleted_at: null },
        include: { class: true, section: true },
      });
      if (!newSection) {
        throw new UnprocessableEntityException({
          success: false,
          message: 'بيانات التسكين غير صالحة.',
          errors: {
            class_section_id: ['الشعبة المحددة غير صالحة أو غير موجودة.'],
          },
        });
      }
      updateData.class = { connect: { id: newSection.class_id } };
      updateData.grade_level = newSection.class.grade_level;
      updateData.class_section = { connect: { id: BigInt(dto.class_section_id) } };
      sectionName = newSection.section.name;
    }

    if (dto.seating_number !== undefined) {
      updateData.seating_number = dto.seating_number;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    const updated = await this.prisma.studentEnrollment.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    // Audit Logging
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'update_student_enrollment',
      entityType: 'student_enrollments',
      entityId: BigInt(id),
      oldValues: {
        class_section_id: Number(current.class_section_id),
        seating_number: current.seating_number,
        status: current.status,
      },
      newValues: {
        class_section_id: dto.class_section_id ?? Number(current.class_section_id),
        seating_number: updated.seating_number,
        status: updated.status,
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث بيانات التسكين ورقم الجلوس بنجاح.',
      data: {
        id: Number(updated.id),
        class_section_id: Number(updated.class_section_id),
        section_name: sectionName,
        seating_number: updated.seating_number,
        status: updated.status,
      },
    };
  }

  /**
   * Operation 1.4: POST /api/v1/student-enrollments/bulk-enroll
   * Atomically bulk enrolls multiple students into a section
   */
  async bulkEnroll(
    dto: BulkEnrollDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!dto.student_ids || dto.student_ids.length === 0) {
      throw new UnprocessableEntityException('قائمة الطلاب غير صالحة أو فارغة.');
    }

    const section = await this.prisma.classSection.findUnique({
      where: { id: BigInt(dto.class_section_id), deleted_at: null },
      include: { class: true },
    });
    if (!section) {
      throw new UnprocessableEntityException('الشعبة المحددة غير صالحة أو غير موجودة.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Check for any existing active enrollment in the same year
      const conflicting = await tx.studentEnrollment.findFirst({
        where: {
          academic_year_id: BigInt(dto.academic_year_id),
          student_id: { in: dto.student_ids.map((id) => BigInt(id)) },
          deleted_at: null,
        },
      });

      if (conflicting) {
        throw new ConflictException(
          'تعارض في التسكين الجماعي: أحد الطلاب المحددين مسكن مسبقاً بالعام الدراسي الحالي.',
        );
      }

      // Enroll each student
      for (const sId of dto.student_ids) {
        const existing = await tx.studentEnrollment.findUnique({
          where: {
            academic_year_id_student_id: {
              academic_year_id: BigInt(dto.academic_year_id),
              student_id: BigInt(sId),
            },
          },
        });

        if (existing) {
          await tx.studentEnrollment.update({
            where: { id: existing.id },
            data: {
              class_id: section.class_id,
              grade_level: section.class.grade_level,
              class_section_id: BigInt(dto.class_section_id),
              status: EnrollmentStatus.enrolled,
              deleted_at: null,
            },
          });
        } else {
          await tx.studentEnrollment.create({
            data: {
              academic_year_id: BigInt(dto.academic_year_id),
              student_id: BigInt(sId),
              class_id: section.class_id,
              grade_level: section.class.grade_level,
              class_section_id: BigInt(dto.class_section_id),
              status: EnrollmentStatus.enrolled,
            },
          });
        }
      }
    });

    // Audit Logging
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'bulk_enroll_students',
      entityType: 'student_enrollments',
      entityId: BigInt(section.id),
      newValues: {
        academic_year_id: dto.academic_year_id,
        class_section_id: dto.class_section_id,
        student_count: dto.student_ids.length,
        student_ids: dto.student_ids,
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: `تم التسكين الجماعي لـ ${dto.student_ids.length} طلاب بنجاح بالحدث الذري.`,
      data: {
        enrolled_count: dto.student_ids.length,
        class_id: Number(section.class_id),
        class_name: section.class.name,
        class_section_id: Number(section.id),
        academic_year_id: dto.academic_year_id,
      },
    };
  }

  /**
   * Operation 1.5: DELETE /api/v1/student-enrollments/:id
   * Soft deletes enrollment with RESTRICT relational integrity check
   */
  async delete(
    id: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id: BigInt(id), deleted_at: null },
    });

    if (!enrollment) {
      throw new NotFoundException('سجل التسكين غير موجود.');
    }

    // Check RESTRICT: linked to transcripts, exams, or grades
    const linkedTranscripts = await this.prisma.studentTranscript.count({
      where: {
        student_id: enrollment.student_id,
        deleted_at: null,
      },
    });

    if (linkedTranscripts > 0) {
      throw new ConflictException(
        'لا يمكن إلغاء التسكين لارتباط الطالب بدرجات أو واجبات أو امتحانات مرصودة بالسجل الأكاديمي (Foreign Key Restrict).',
      );
    }

    // Soft delete
    await this.prisma.studentEnrollment.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });

    // Audit Logging
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'delete_student_enrollment',
      entityType: 'student_enrollments',
      entityId: BigInt(id),
      oldValues: {
        student_id: Number(enrollment.student_id),
        academic_year_id: Number(enrollment.academic_year_id),
        class_section_id: Number(enrollment.class_section_id),
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم إلغاء سجل التسكين وتجريد الطالب بنجاح.',
    };
  }
}
