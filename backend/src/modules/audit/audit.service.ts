import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface CreateAuditLogParams {
  userId?: bigint | null;
  action: string;
  entityType: string;
  entityId?: bigint | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          user_id: params.userId ?? null,
          action: params.action,
          entity_type: params.entityType,
          entity_id: params.entityId ?? null,
          old_values: params.oldValues ?? null,
          new_values: params.newValues ?? null,
          ip_address: params.ipAddress ?? null,
          user_agent: params.userAgent ?? null,
        },
      });
    } catch (error) {
      console.error('⚠️ Failed to write audit log:', error);
      return null;
    }
  }

  private getActionArabic(action: string): string {
    const map: Record<string, string> = {
      login: 'تسجيل دخول',
      logout: 'تسجيل خروج',
      login_failed: 'محاولة دخول فاشلة',
      login_blocked: 'محاولة دخول محظورة',
      create: 'إنشاء سجل',
      update: 'تعديل بيانات',
      delete: 'حذف سجل',
      user_activated: 'تفعيل حساب',
      user_deactivated: 'تعطيل حساب',
      password_change: 'تغيير كلمة المرور',
      admin_reset_password: 'إعادة تعيين كلمة المرور',
      promote: 'ترحيل أكاديمي',
      export: 'تصدير بيانات',
    };
    return map[action] || action;
  }

  async findAll(query: {
    page?: number;
    per_page?: number;
    action?: string;
    entity_type?: string;
    user_id?: number | bigint;
    date_from?: string;
    date_to?: string;
    from_date?: string;
    to_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.entity_type) where.entity_type = query.entity_type;
    if (query.user_id) where.user_id = BigInt(query.user_id);

    const fromDate = query.date_from || query.from_date;
    const toDate = query.date_to || query.to_date;

    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }

    const validSortFields = ['id', 'created_at'];
    const sortBy = validSortFields.includes(query.sort_by || '') ? query.sort_by! : 'created_at';
    const sortOrder = query.sort_order === 'asc' ? 'asc' : 'desc';

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              user_code: true,
              role_type: true,
            },
          },
        },
      }),
    ]);

    const serializedLogs = logs.map((log) => ({
      id: Number(log.id),
      user_id: log.user_id ? Number(log.user_id) : null,
      user_code: log.user?.user_code || null,
      action: log.action,
      action_ar: this.getActionArabic(log.action),
      entity_type: log.entity_type,
      entity_id: log.entity_id ? Number(log.entity_id) : null,
      old_values: log.old_values,
      new_values: log.new_values,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at.toISOString(),
    }));

    const lastPage = Math.ceil(total / perPage) || 1;

    return {
      success: true,
      message: total > 0 ? 'تم جلب سجلات التدقيق بنجاح.' : 'لا توجد سجلات تدقيق تطابق محددات البحث.',
      data: serializedLogs,
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
    const log = await this.prisma.auditLog.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            user_code: true,
            role_type: true,
          },
        },
      },
    });

    if (!log) {
      return null;
    }

    return {
      id: Number(log.id),
      user_id: log.user_id ? Number(log.user_id) : null,
      user_code: log.user?.user_code || null,
      action: log.action,
      action_ar: this.getActionArabic(log.action),
      entity_type: log.entity_type,
      entity_id: log.entity_id ? Number(log.entity_id) : null,
      old_values: log.old_values,
      new_values: log.new_values,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at.toISOString(),
    };
  }
}
