import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { FindTeachersQueryDto } from './dto/find-teachers-query.dto.js';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: FindTeachersQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const perPage = Math.max(1, Number(query.per_page) || 15);
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.specialization) {
      where.specialization = {
        contains: query.specialization,
      };
    }

    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search } },
        { user: { user_code: { contains: query.search } } },
      ];
    }

    if (query.is_active !== undefined && query.is_active !== '') {
      where.user = {
        ...(where.user || {}),
        is_active: Number(query.is_active),
      };
    }

    const orderBy: any = {};
    const sortOrder = query.sort_order || 'desc';
    if (query.sort_by === 'user_code') {
      orderBy.user = { user_code: sortOrder };
    } else if (query.sort_by === 'full_name') {
      orderBy.full_name = sortOrder;
    } else if (query.sort_by === 'hire_date') {
      orderBy.hire_date = sortOrder;
    } else {
      orderBy.id = sortOrder;
    }

    const [total, teachers] = await Promise.all([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.findMany({
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
        },
      }),
    ]);

    const data = teachers.map((t) => ({
      id: Number(t.id),
      user_id: Number(t.user_id),
      user_code: t.user.user_code,
      full_name: t.full_name,
      phone: t.phone,
      specialization: t.specialization,
      hire_date: t.hire_date ? t.hire_date.toISOString().split('T')[0] : null,
      is_active: t.user.is_active,
    }));

    return {
      success: true,
      message: total > 0 ? 'تم جلب قائمة المعلمين بنجاح.' : 'لا يوجد معلمون مسجلون يطابقون محددات البحث.',
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
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            user_code: true,
            is_active: true,
          },
        },
      },
    });

    if (!teacher || teacher.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف المعلم غير موجود.',
      });
    }

    // Role-based scoping / IDOR prevention: Teacher can only inspect own profile
    if (
      currentUser &&
      currentUser.role_type === RoleType.teacher &&
      Number(currentUser.id) !== Number(teacher.user_id)
    ) {
      throw new ForbiddenException({
        success: false,
        message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      });
    }

    return {
      success: true,
      message: 'تم جلب تفاصيل ملف المعلم بنجاح.',
      data: {
        id: Number(teacher.id),
        user_id: Number(teacher.user_id),
        user_code: teacher.user.user_code,
        full_name: teacher.full_name,
        phone: teacher.phone,
        specialization: teacher.specialization,
        hire_date: teacher.hire_date ? teacher.hire_date.toISOString().split('T')[0] : null,
        is_active: teacher.user.is_active,
        created_at: teacher.created_at.toISOString(),
      },
    };
  }

  async create(
    dto: CreateTeacherDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check phone uniqueness if provided
    if (dto.phone) {
      const existingPhone = await this.prisma.teacher.findFirst({
        where: {
          phone: dto.phone,
          deleted_at: null,
        },
      });
      if (existingPhone) {
        throw new ConflictException({
          success: false,
          message: 'رقم هاتف المعلم مسجل مسبقاً.',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Atomic transaction: sequence generation, User creation, Teacher creation
    const { newTeacher, newUser } = await this.prisma.$transaction(async (tx) => {
      let userCode = dto.user_code?.trim();

      if (userCode) {
        if (!userCode.startsWith('TCH-')) {
          userCode = `TCH-${userCode}`;
        }
        const existing = await tx.user.findUnique({
          where: { user_code: userCode },
        });
        if (existing) {
          throw new ConflictException({
            success: false,
            message: `رمز المعلم (${userCode}) مسجل مسبقاً لمستخدم آخر.`,
          });
        }
      } else {
        // Find highest existing TCH-XXXX code
        const latestUsers = await tx.user.findMany({
          where: {
            user_code: { startsWith: 'TCH-' },
          },
          select: { user_code: true },
        });

        let nextNumber = 2001;
        for (const u of latestUsers) {
          const num = parseInt(u.user_code.replace('TCH-', ''), 10);
          if (!isNaN(num) && num >= nextNumber) {
            nextNumber = num + 1;
          }
        }

        userCode = `TCH-${nextNumber}`;
      }

      const user = await tx.user.create({
        data: {
          user_code: userCode,
          password: hashedPassword,
          role_type: RoleType.teacher,
          is_active: 1,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          user_id: user.id,
          full_name: dto.full_name,
          phone: dto.phone || null,
          specialization: dto.specialization || null,
          hire_date: dto.hire_date ? new Date(dto.hire_date) : null,
        },
      });

      return { newTeacher: teacher, newUser: user };
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'teacher_created',
      entityType: 'Teacher',
      entityId: newTeacher.id,
      newValues: {
        id: Number(newTeacher.id),
        user_id: Number(newUser.id),
        user_code: newUser.user_code,
        full_name: newTeacher.full_name,
        phone: newTeacher.phone,
        specialization: newTeacher.specialization,
        hire_date: dto.hire_date || null,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم إنشاء ملف المعلم وتوليد حساب الدخول الموحد بنجاح.',
      data: {
        id: Number(newTeacher.id),
        user_id: Number(newUser.id),
        user_code: newUser.user_code,
        full_name: newTeacher.full_name,
        phone: newTeacher.phone,
        specialization: newTeacher.specialization,
        hire_date: dto.hire_date || null,
        created_at: newTeacher.created_at.toISOString(),
      },
    };
  }

  async update(
    id: number,
    dto: UpdateTeacherDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: true,
      },
    });

    if (!teacher || teacher.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف المعلم غير موجود.',
      });
    }

    if (dto.phone && dto.phone !== teacher.phone) {
      const existingPhone = await this.prisma.teacher.findFirst({
        where: {
          phone: dto.phone,
          deleted_at: null,
          id: { not: teacher.id },
        },
      });
      if (existingPhone) {
        throw new ConflictException({
          success: false,
          message: 'رقم هاتف المعلم مسجل مسبقاً.',
        });
      }
    }

    let updatedUserCode: string | undefined;
    if (dto.user_code) {
      let code = dto.user_code.trim();
      if (!code.startsWith('TCH-')) {
        code = `TCH-${code}`;
      }
      if (code !== teacher.user.user_code) {
        const existingUser = await this.prisma.user.findUnique({
          where: { user_code: code },
        });
        if (existingUser && existingUser.id !== teacher.user_id) {
          throw new ConflictException({
            success: false,
            message: `رمز المعلم (${code}) مسجل مسبقاً لمستخدم آخر.`,
          });
        }
        updatedUserCode = code;
      }
    }

    const oldValues = {
      user_code: teacher.user.user_code,
      full_name: teacher.full_name,
      phone: teacher.phone,
      specialization: teacher.specialization,
      hire_date: teacher.hire_date ? teacher.hire_date.toISOString().split('T')[0] : null,
    };

    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedTeacher = await tx.teacher.update({
        where: { id: teacher.id },
        data: {
          full_name: dto.full_name ?? teacher.full_name,
          phone: dto.phone !== undefined ? dto.phone : teacher.phone,
          specialization: dto.specialization !== undefined ? dto.specialization : teacher.specialization,
          hire_date:
            dto.hire_date !== undefined
              ? dto.hire_date
                ? new Date(dto.hire_date)
                : null
              : teacher.hire_date,
        },
        include: {
          user: true,
        },
      });

      if (hashedPassword || updatedUserCode) {
        const userData: any = {};
        if (hashedPassword) userData.password = hashedPassword;
        if (updatedUserCode) userData.user_code = updatedUserCode;

        await tx.user.update({
          where: { id: teacher.user_id },
          data: userData,
        });

        if (hashedPassword) {
          await tx.personalAccessToken.deleteMany({
            where: { user_id: teacher.user_id },
          });
        }
      }

      return updatedTeacher;
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'teacher_updated',
      entityType: 'Teacher',
      entityId: teacher.id,
      oldValues,
      newValues: {
        full_name: updated.full_name,
        phone: updated.phone,
        specialization: updated.specialization,
        hire_date: updated.hire_date ? updated.hire_date.toISOString().split('T')[0] : null,
        password_changed: !!hashedPassword,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث بيانات ملف المعلم بنجاح.',
      data: {
        id: Number(updated.id),
        user_id: Number(updated.user_id),
        user_code: updated.user.user_code,
        full_name: updated.full_name,
        phone: updated.phone,
        specialization: updated.specialization,
        hire_date: updated.hire_date ? updated.hire_date.toISOString().split('T')[0] : null,
      },
    };
  }

  async delete(
    id: number,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: BigInt(id) },
    });

    if (!teacher || teacher.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف المعلم غير موجود.',
      });
    }

    // Strict RESTRICT Protection: Check if teacher has teaching assignments
    const activeAssignments = await this.prisma.teachingAssignment.count({
      where: {
        teacher_id: teacher.id,
        deleted_at: null,
      },
    });

    if (activeAssignments > 0) {
      throw new ConflictException({
        success: false,
        message: 'لا يمكن حذف ملف المعلم لوجود إسنادات تدريس أو جداول حصص مرتبطة به (RESTRICT).',
      });
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { deleted_at: now },
      });

      await tx.user.update({
        where: { id: teacher.user_id },
        data: { deleted_at: now, is_active: 0 },
      });

      await tx.personalAccessToken.deleteMany({
        where: { user_id: teacher.user_id },
      });
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'teacher_deleted',
      entityType: 'Teacher',
      entityId: teacher.id,
      oldValues: {
        id: Number(teacher.id),
        user_id: Number(teacher.user_id),
        full_name: teacher.full_name,
      },
      newValues: {
        deleted_at: now.toISOString(),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم حذف ملف المعلم وحسابه بنجاح.',
    };
  }
}
