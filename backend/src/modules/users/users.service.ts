import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto.js';
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

    const [total, users, countsByRole] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { id: 'asc' },
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
    const roleMap: Record<string, { role_type: string; role_title_ar: string; users_count: number; users: any[] }> = {
      admin: { role_type: 'admin', role_title_ar: 'مديرو النظام', users_count: 0, users: [] },
      teacher: { role_type: 'teacher', role_title_ar: 'المعلمون', users_count: 0, users: [] },
      student: { role_type: 'student', role_title_ar: 'الطلاب', users_count: 0, users: [] },
      parent: { role_type: 'parent', role_title_ar: 'أولياء الأمور', users_count: 0, users: [] },
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

    return {
      success: true,
      data: {
        role_types,
        summary_counts: summaryCounts,
      },
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
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

    return {
      success: true,
      data: {
        id: Number(user.id),
        user_code: user.user_code,
        full_name: fullName,
        phone,
        role_type: user.role_type,
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
}
