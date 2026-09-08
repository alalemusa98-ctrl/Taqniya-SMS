import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { FindStudentsQueryDto } from './dto/find-students-query.dto.js';
import { RoleType, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: FindStudentsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const perPage = Math.max(1, Number(query.per_page) || 15);
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.class_section_id) {
      where.enrollments = {
        some: {
          class_section_id: BigInt(query.class_section_id),
          deleted_at: null,
        },
      };
    } else if (query.class_id) {
      where.enrollments = {
        some: {
          class_id: BigInt(query.class_id),
          deleted_at: null,
        },
      };
    }

    if (query.gender && (query.gender === 'male' || query.gender === 'female')) {
      where.gender = query.gender as Gender;
    }

    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search } },
        { user: { user_code: { contains: query.search } } },
      ];
    }

    const orderBy: any = {};
    const sortOrder = query.sort_order || 'desc';
    if (query.sort_by === 'full_name') {
      orderBy.full_name = sortOrder;
    } else if (query.sort_by === 'birth_date') {
      orderBy.birth_date = sortOrder;
    } else {
      orderBy.id = sortOrder;
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              user_code: true,
              is_active: true,
            },
          },
          enrollments: {
            where: { deleted_at: null },
            orderBy: { id: 'desc' },
            take: 1,
            include: {
              class: true,
              class_section: {
                include: {
                  section: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const data = students.map((s) => {
      let classSectionStr: string | null = null;
      let classId: number | null = null;
      let classSectionId: number | null = null;
      let seatingNumber: string | null = null;
      if (s.enrollments && s.enrollments.length > 0) {
        const enr = s.enrollments[0];
        const className = enr.class?.name || '';
        const sectionName = enr.class_section?.section?.name || '';
        classSectionStr = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
        classId = enr.class_id ? Number(enr.class_id) : null;
        classSectionId = enr.class_section_id ? Number(enr.class_section_id) : null;
        seatingNumber = enr.seating_number || null;
      }

      return {
        id: Number(s.id),
        user_id: Number(s.user_id),
        user_code: s.user.user_code,
        full_name: s.full_name,
        phone: s.phone,
        birth_date: s.birth_date ? s.birth_date.toISOString().split('T')[0] : null,
        gender: s.gender,
        class_section: classSectionStr,
        class_id: classId,
        class_section_id: classSectionId,
        seating_number: seatingNumber,
        created_at: s.created_at.toISOString(),
      };
    });

    return {
      success: true,
      message: total > 0 ? 'تم جلب قائمة الطلاب بنجاح.' : 'لا توجد سجلات طلاب تطابق محددات البحث.',
      data,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findOne(id: number, currentUser?: any) {
    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            user_code: true,
            is_active: true,
          },
        },
        enrollments: {
          where: { deleted_at: null },
          orderBy: { id: 'desc' },
          take: 1,
          include: {
            class: true,
            class_section: {
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    if (!student || student.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف الطالب غير موجود.',
      });
    }

    // Role-based scoping / IDOR prevention:
    if (currentUser) {
      if (currentUser.role_type === RoleType.student) {
        if (Number(currentUser.id) !== Number(student.user_id)) {
          throw new ForbiddenException({
            success: false,
            message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
          });
        }
      } else if (currentUser.role_type === RoleType.parent) {
        // Must be a guardian linked to this student
        const isGuardian = await this.prisma.guardianStudent.findFirst({
          where: {
            student_id: student.id,
            guardian: {
              user_id: BigInt(currentUser.id),
              deleted_at: null,
            },
            deleted_at: null,
          },
        });
        if (!isGuardian) {
          throw new ForbiddenException({
            success: false,
            message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
          });
        }
      }
    }

    let classSectionStr: string | null = null;
    let classId: number | null = null;
    let classSectionId: number | null = null;
    let seatingNumber: string | null = null;
    if (student.enrollments && student.enrollments.length > 0) {
      const enr = student.enrollments[0];
      const className = enr.class?.name || '';
      const sectionName = enr.class_section?.section?.name || '';
      classSectionStr = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
      classId = enr.class_id ? Number(enr.class_id) : null;
      classSectionId = enr.class_section_id ? Number(enr.class_section_id) : null;
      seatingNumber = enr.seating_number || null;
    }

    return {
      success: true,
      message: 'تم جلب تفاصيل ملف الطالب بنجاح.',
      data: {
        id: Number(student.id),
        user_id: Number(student.user_id),
        user_code: student.user.user_code,
        full_name: student.full_name,
        phone: student.phone,
        birth_date: student.birth_date ? student.birth_date.toISOString().split('T')[0] : null,
        gender: student.gender,
        class_section: classSectionStr,
        class_id: classId,
        class_section_id: classSectionId,
        seating_number: seatingNumber,
        created_at: student.created_at.toISOString(),
      },
    };
  }

  async create(
    dto: CreateStudentDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const { newStudent, newUser, newEnrollment, enrollmentDetails } =
      await this.prisma.$transaction(async (tx) => {
        // Sequence generation for STU-XXXX
        const latestUsers = await tx.user.findMany({
          where: {
            user_code: { startsWith: 'STU-' },
          },
          select: { user_code: true },
        });

        let nextNumber = 3001;
        for (const u of latestUsers) {
          const num = parseInt(u.user_code.replace('STU-', ''), 10);
          if (!isNaN(num) && num >= nextNumber) {
            nextNumber = num + 1;
          }
        }

        const userCode = `STU-${nextNumber}`;

        const user = await tx.user.create({
          data: {
            user_code: userCode,
            password: hashedPassword,
            role_type: RoleType.student,
            is_active: 1,
          },
        });

        const student = await tx.student.create({
          data: {
            user_id: user.id,
            full_name: dto.full_name,
            phone: dto.phone || null,
            birth_date: dto.birth_date ? new Date(dto.birth_date) : null,
            gender: dto.gender,
          },
        });

        let enrollment: any = null;
        let details: any = null;

        if (dto.class_section_id) {
          // Resolve class_section and class_id
          const classSection = await tx.classSection.findUnique({
            where: { id: BigInt(dto.class_section_id) },
            include: {
              class: true,
              section: true,
            },
          });

          if (!classSection) {
            throw new BadRequestException({
              success: false,
              message: 'الشعبة الدراسية المحددة غير موجودة.',
            });
          }

          // Resolve academic_year_id
          let yearId: bigint;
          if (dto.academic_year_id) {
            yearId = BigInt(dto.academic_year_id);
          } else {
            const activeYear = await tx.academicYear.findFirst({
              where: { is_active: 1, deleted_at: null },
            });
            if (!activeYear) {
              throw new BadRequestException({
                success: false,
                message: 'لا يوجد عام دراسي نشط حالياً لتسكين الطالب.',
              });
            }
            yearId = activeYear.id;
          }

          const year = await tx.academicYear.findUnique({ where: { id: yearId } });

          enrollment = await tx.studentEnrollment.create({
            data: {
              student_id: student.id,
              academic_year_id: yearId,
              class_id: classSection.class_id,
              class_section_id: classSection.id,
              grade_level: classSection.class?.grade_level || 1,
              seating_number: dto.seating_number || null,
              status: 'enrolled',
            },
          });

          details = {
            id: Number(enrollment.id),
            academic_year_id: Number(yearId),
            academic_year_name: year?.name || '',
            class_id: Number(classSection.class_id),
            class_name: classSection.class?.name || '',
            class_section_id: Number(classSection.id),
            section_name: classSection.section?.name || '',
            seating_number: dto.seating_number || null,
            status: 'enrolled',
          };
        }

        return {
          newStudent: student,
          newUser: user,
          newEnrollment: enrollment,
          enrollmentDetails: details,
        };
      });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'student_created',
      entityType: 'Student',
      entityId: newStudent.id,
      newValues: {
        id: Number(newStudent.id),
        user_id: Number(newUser.id),
        user_code: newUser.user_code,
        full_name: newStudent.full_name,
        gender: newStudent.gender,
        birth_date: dto.birth_date || null,
        phone: newStudent.phone,
        enrollment: enrollmentDetails,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: dto.class_section_id
        ? 'تم إنشاء ملف الطالب وتوليد حساب الدخول وتسكينه بالشعبة بنجاح.'
        : 'تم إنشاء ملف الطالب وتوليد حساب الدخول الموحد بنجاح.',
      data: {
        id: Number(newStudent.id),
        user_id: Number(newUser.id),
        user_code: newUser.user_code,
        full_name: newStudent.full_name,
        phone: newStudent.phone,
        birth_date: newStudent.birth_date ? newStudent.birth_date.toISOString().split('T')[0] : null,
        gender: newStudent.gender,
        enrollment: enrollmentDetails,
        created_at: newStudent.created_at.toISOString(),
      },
    };
  }

  async update(
    id: number,
    dto: UpdateStudentDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(id) },
      include: { user: true },
    });

    if (!student || student.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف الطالب غير موجود.',
      });
    }

    const oldValues = {
      full_name: student.full_name,
      phone: student.phone,
      birth_date: student.birth_date ? student.birth_date.toISOString().split('T')[0] : null,
      gender: student.gender,
    };

    let hashedPassword: string | undefined = undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (hashedPassword) {
        await tx.user.update({
          where: { id: student.user_id },
          data: { password: hashedPassword },
        });
      }

      const updatedStudent = await tx.student.update({
        where: { id: BigInt(id) },
        data: {
          full_name: dto.full_name ?? undefined,
          phone: dto.phone ?? undefined,
          birth_date: dto.birth_date ? new Date(dto.birth_date) : undefined,
          gender: dto.gender ?? undefined,
        },
        include: { user: true },
      });

      // Update enrollment if class_section_id is provided
      if (dto.class_section_id) {
        const classSection = await tx.classSection.findUnique({
          where: { id: BigInt(dto.class_section_id) },
          include: { class: true },
        });
        if (classSection) {
          let yearId: bigint;
          if (dto.academic_year_id) {
            yearId = BigInt(dto.academic_year_id);
          } else {
            const activeYear = await tx.academicYear.findFirst({
              where: { is_active: 1, deleted_at: null },
            });
            yearId = activeYear ? activeYear.id : BigInt(1);
          }

          const existingEnrollment = await tx.studentEnrollment.findFirst({
            where: {
              student_id: student.id,
              deleted_at: null,
            },
            orderBy: { id: 'desc' },
          });

          if (existingEnrollment) {
            await tx.studentEnrollment.update({
              where: { id: existingEnrollment.id },
              data: {
                academic_year_id: yearId,
                class_id: classSection.class_id,
                class_section_id: classSection.id,
                grade_level: classSection.class?.grade_level || 1,
                seating_number: dto.seating_number ?? existingEnrollment.seating_number,
              },
            });
            await tx.studentEnrollment.updateMany({
              where: {
                student_id: student.id,
                id: { not: existingEnrollment.id },
                deleted_at: null,
              },
              data: { deleted_at: new Date() },
            });
          } else {
            await tx.studentEnrollment.create({
              data: {
                student_id: student.id,
                academic_year_id: yearId,
                class_id: classSection.class_id,
                class_section_id: classSection.id,
                grade_level: classSection.class?.grade_level || 1,
                seating_number: dto.seating_number || null,
                status: 'enrolled',
              },
            });
          }
        }
      }

      return updatedStudent;
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'student_updated',
      entityType: 'Student',
      entityId: student.id,
      oldValues,
      newValues: {
        full_name: updated.full_name,
        phone: updated.phone,
        birth_date: updated.birth_date ? updated.birth_date.toISOString().split('T')[0] : null,
        gender: updated.gender,
        password_changed: !!hashedPassword,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث بيانات ملف الطالب بنجاح.',
      data: {
        id: Number(updated.id),
        user_id: Number(updated.user_id),
        user_code: updated.user.user_code,
        full_name: updated.full_name,
        phone: updated.phone,
        birth_date: updated.birth_date ? updated.birth_date.toISOString().split('T')[0] : null,
        gender: updated.gender,
      },
    };
  }

  async delete(
    id: number,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(id) },
    });

    if (!student || student.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف الطالب غير موجود.',
      });
    }

    // Strict RESTRICT Protection: Check if student has enrollments or guardian links
    const activeEnrollments = await this.prisma.studentEnrollment.count({
      where: {
        student_id: student.id,
        deleted_at: null,
      },
    });

    const activeCustodies = await this.prisma.guardianStudent.count({
      where: {
        student_id: student.id,
        deleted_at: null,
      },
    });

    if (activeEnrollments > 0 || activeCustodies > 0) {
      throw new ConflictException({
        success: false,
        message:
          'لا يمكن حذف الطالب لوجود سجلات تسكين أكاديمي أو درجات أو واجبات مرتبطة به في المنظومة (Foreign Key Restrict).',
      });
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: { deleted_at: now },
      });

      await tx.user.update({
        where: { id: student.user_id },
        data: { deleted_at: now, is_active: 0 },
      });

      await tx.personalAccessToken.deleteMany({
        where: { user_id: student.user_id },
      });
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'student_deleted',
      entityType: 'Student',
      entityId: student.id,
      oldValues: {
        id: Number(student.id),
        user_id: Number(student.user_id),
        full_name: student.full_name,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم حذف ملف الطالب وحسابه بنجاح.',
    };
  }
}
