import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAllTree(query: {
    role_type?: RoleType;
    is_active?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.role_type) {
      where.role_type = query.role_type;
    }

    if (query.is_active !== undefined && !isNaN(Number(query.is_active))) {
      where.is_active = Number(query.is_active);
    }

    if (query.search) {
      where.OR = [
        { user_code: { contains: query.search } },
        { teacher_profile: { full_name: { contains: query.search } } },
        { student_profile: { full_name: { contains: query.search } } },
        { guardian_profile: { full_name: { contains: query.search } } },
      ];
    }

    // Dynamic sorting
    const validSortFields = ['id', 'user_code', 'last_login_at', 'created_at'];
    const sortBy = validSortFields.includes(query.sort_by || '') ? query.sort_by! : 'id';
    const sortOrder = query.sort_order === 'desc' ? 'desc' : 'asc';

    const [total, users, countsByRole] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          user_code: true,
          role_type: true,
          is_active: true,
          last_login_at: true,
          created_at: true,
          teacher_profile: { select: { full_name: true } },
          student_profile: { select: { full_name: true } },
          guardian_profile: { select: { full_name: true } },
        },
      }),
      this.prisma.user.groupBy({
        by: ['role_type'],
        where: { deleted_at: null },
        _count: { id: true },
      }),
    ]);

    const summaryCounts: Record<string, number> = {
      total: 0,
      admin: 0,
      teacher: 0,
      student: 0,
      parent: 0,
    };
    for (const c of countsByRole) {
      summaryCounts[c.role_type] = c._count.id;
      summaryCounts.total += c._count.id;
    }

    // Grouping into Role-Tree Matrix
    const roleMap: Record<string, { role_type: string; role_type_ar: string; role_title_ar: string; users_count: number; users: any[] }> = {
      admin: { role_type: 'admin', role_type_ar: 'مديرو النظام', role_title_ar: 'مديرو النظام', users_count: 0, users: [] },
      teacher: { role_type: 'teacher', role_type_ar: 'المعلمون', role_title_ar: 'المعلمون', users_count: 0, users: [] },
      student: { role_type: 'student', role_type_ar: 'الطلاب', role_title_ar: 'الطلاب', users_count: 0, users: [] },
      parent: { role_type: 'parent', role_type_ar: 'أولياء الأمور', role_title_ar: 'أولياء الأمور', users_count: 0, users: [] },
    };

    for (const u of users) {
      const fullName =
        u.teacher_profile?.full_name ||
        u.student_profile?.full_name ||
        u.guardian_profile?.full_name ||
        null;

      const serialized = {
        id: Number(u.id),
        user_code: u.user_code,
        full_name: fullName,
        role_type: u.role_type,
        is_active: u.is_active,
        last_login_at: u.last_login_at ? u.last_login_at.toISOString() : null,
        created_at: u.created_at.toISOString(),
      };

      if (roleMap[u.role_type]) {
        roleMap[u.role_type].users.push(serialized);
        roleMap[u.role_type].users_count++;
      }
    }

    const role_types = Object.values(roleMap).filter(
      (group) => !query.role_type || group.role_type === query.role_type,
    );

    const lastPage = Math.ceil(total / perPage) || 1;

    return {
      success: true,
      message: total > 0 ? 'تم جلب قائمة حسابات المستخدمين بنجاح.' : 'لا يوجد مستخدمون يطابقون محددات البحث.',
      data: {
        total_users: total,
        role_types,
        summary_counts: summaryCounts,
      },
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: lastPage,
        total_pages: lastPage,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        user_code: true,
        role_type: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        teacher_profile: { select: { full_name: true, phone: true } },
        student_profile: { select: { full_name: true, phone: true, gender: true } },
        guardian_profile: { select: { full_name: true, phone: true, relationship: true } },
      },
    });

    if (!user || user.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'حساب المستخدم غير موجود.',
      });
    }

    const fullName =
      user.teacher_profile?.full_name ||
      user.student_profile?.full_name ||
      user.guardian_profile?.full_name ||
      null;

    const phone =
      user.teacher_profile?.phone ||
      user.student_profile?.phone ||
      user.guardian_profile?.phone ||
      null;

    const roleArMap: Record<string, string> = {
      admin: 'مدير نظام',
      teacher: 'معلم',
      student: 'طالب',
      parent: 'ولي أمر',
    };

    return {
      success: true,
      message: 'تم جلب تفاصيل حساب المستخدم بنجاح.',
      data: {
        id: Number(user.id),
        user_code: user.user_code,
        full_name: fullName,
        phone,
        role_type: user.role_type,
        role_type_ar: roleArMap[user.role_type] || user.role_type,
        is_active: user.is_active,
        last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at ? user.updated_at.toISOString() : null,
      },
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateUserStatusDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user || user.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'حساب المستخدم غير موجود.',
      });
    }

    // Protection: Prevent admin from disabling their own account
    if (Number(user.id) === adminId && dto.is_active === 0) {
      throw new BadRequestException({
        success: false,
        message: 'لا يمكنك تعطيل حسابك الإداري الحالي.',
      });
    }

    const oldStatus = user.is_active;

    // Transaction: update status, if disabling invalidate all tokens, and log audit
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { is_active: dto.is_active },
      });

      if (dto.is_active === 0) {
        // Invalidate active sessions
        await tx.personalAccessToken.deleteMany({
          where: { user_id: user.id },
        });
      }
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: dto.is_active === 1 ? 'user_activated' : 'user_deactivated',
      entityType: 'User',
      entityId: user.id,
      oldValues: { is_active: oldStatus },
      newValues: { is_active: dto.is_active, reason: dto.reason ?? null },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message:
        dto.is_active === 1
          ? 'تم تفعيل حساب المستخدم بنجاح.'
          : 'تم إيقاف حساب المستخدم بنجاح وإلغاء كافة جلساته النشطة.',
      data: {
        id: Number(user.id),
        user_code: user.user_code,
        is_active: dto.is_active,
        updated_at: new Date().toISOString(),
      },
    };
  }

  async resetPassword(
    id: number,
    dto: AdminResetPasswordDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    if (!user || user.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'حساب المستخدم غير موجود.',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.new_password, 10);

    // Transaction: update password and invalidate previous sessions
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await tx.personalAccessToken.deleteMany({
        where: { user_id: user.id },
      });
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'admin_reset_password',
      entityType: 'User',
      entityId: user.id,
      newValues: { message: 'Password reset by admin' },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح وإلغاء جلسات المستخدم السابقة.',
    };
  }

  async createAdmin(
    dto: CreateAdminUserDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    let userCode = dto.user_code?.trim();

    // If no user code supplied, generate next sequential ADM-XXXX code
    if (!userCode) {
      const lastAdmin = await this.prisma.user.findFirst({
        where: {
          role_type: RoleType.admin,
          user_code: { startsWith: 'ADM-' },
        },
        orderBy: { id: 'desc' },
      });

      let nextNum = 1002;
      if (lastAdmin && lastAdmin.user_code) {
        const match = lastAdmin.user_code.match(/^ADM-(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      userCode = `ADM-${nextNum}`;

      let exists = await this.prisma.user.findUnique({ where: { user_code: userCode } });
      while (exists) {
        nextNum++;
        userCode = `ADM-${nextNum}`;
        exists = await this.prisma.user.findUnique({ where: { user_code: userCode } });
      }
    } else {
      const exists = await this.prisma.user.findUnique({ where: { user_code: userCode } });
      if (exists) {
        throw new BadRequestException({
          success: false,
          message: `الرمز المؤسسي (${userCode}) مستخدم بالفعل مسبقاً.`,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const isActive = dto.is_active !== undefined ? dto.is_active : 1;

    const newUser = await this.prisma.user.create({
      data: {
        user_code: userCode,
        password: hashedPassword,
        role_type: RoleType.admin,
        is_active: isActive,
      },
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'user_created',
      entityType: 'User',
      entityId: newUser.id,
      newValues: {
        user_code: newUser.user_code,
        role_type: 'admin',
        is_active: newUser.is_active,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: `تم إنشاء حساب مدير النظام بالرمز (${newUser.user_code}) بنجاح.`,
      data: {
        id: Number(newUser.id),
        user_code: newUser.user_code,
        role_type: newUser.role_type,
        role_type_ar: 'مدير نظام',
        is_active: newUser.is_active,
        created_at: newUser.created_at.toISOString(),
      },
    };
  }
}
