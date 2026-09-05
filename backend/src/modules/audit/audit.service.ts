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

  async findAll(query: {
    page?: number;
    per_page?: number;
    action?: string;
    entity_type?: string;
    from_date?: string;
    to_date?: string;
  }) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.entity_type) where.entity_type = query.entity_type;
    if (query.from_date || query.to_date) {
      where.created_at = {};
      if (query.from_date) where.created_at.gte = new Date(query.from_date);
      if (query.to_date) where.created_at.lte = new Date(query.to_date);
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
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
      entity_type: log.entity_type,
      entity_id: log.entity_id ? Number(log.entity_id) : null,
      old_values: log.old_values,
      new_values: log.new_values,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at.toISOString(),
    }));

    return {
      success: true,
      data: serializedLogs,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
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
