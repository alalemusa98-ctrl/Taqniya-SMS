import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';
import { QuerySectionsDto } from './dto/query-sections.dto.js';

@Injectable()
export class SectionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeSection(s: any) {
    return {
      id: Number(s.id),
      name: s.name,
      created_at: s.created_at ? s.created_at.toISOString() : null,
      updated_at: s.updated_at ? s.updated_at.toISOString() : null,
      deleted_at: s.deleted_at ? s.deleted_at.toISOString() : null,
    };
  }

  async findAll(query: QuerySectionsDto = {}) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.search) {
      where.name = {
        contains: query.search,
      };
    }

    const orderByField = query.sort_by === 'id' ? 'id' : 'name';
    const orderByDirection = query.sort_order === 'desc' ? 'desc' : 'asc';

    const [total, sections] = await Promise.all([
      this.prisma.section.count({ where }),
      this.prisma.section.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [orderByField]: orderByDirection },
      }),
    ]);

    return {
      success: true,
      message: total > 0 ? 'تم جلب بنك الشعب العامة بنجاح.' : 'لا توجد شعب عامة مسجلة.',
      data: sections.map((s) => this.serializeSection(s)),
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findOne(id: number) {
    const section = await this.prisma.section.findUnique({
      where: { id: BigInt(id) },
    });

    if (!section || section.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الشعبة العامة غير موجودة.',
      });
    }

    return {
      success: true,
      data: this.serializeSection(section),
    };
  }

  async create(dto: CreateSectionDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.section.findFirst({
      where: {
        name: dto.name,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'مسمى الشعبة العامة موجود مسبقاً في الكتالوج.',
      });
    }

    const created = await this.prisma.section.create({
      data: {
        name: dto.name,
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'section_created',
        entityType: 'Section',
        entityId: created.id,
        newValues: {
          name: created.name,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم إنشاء الشعبة العامة بنجاح.',
      data: this.serializeSection(created),
    };
  }

  async update(id: number, dto: UpdateSectionDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: BigInt(id) },
    });

    if (!section || section.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الشعبة الدراسية غير موجودة.',
      });
    }

    if (dto.name && dto.name !== section.name) {
      const duplicate = await this.prisma.section.findFirst({
        where: {
          name: dto.name,
          deleted_at: null,
          NOT: { id: section.id },
        },
      });

      if (duplicate) {
        throw new ConflictException({
          success: false,
          message: 'مسمى الشعبة العامة موجود مسبقاً في الكتالوج.',
        });
      }
    }

    const oldValues = {
      name: section.name,
    };

    const updated = await this.prisma.section.update({
      where: { id: section.id },
      data: {
        ...(dto.name && { name: dto.name }),
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'section_updated',
        entityType: 'Section',
        entityId: updated.id,
        oldValues,
        newValues: {
          ...(dto.name && { name: dto.name }),
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم تحديث مسمى الشعبة العامة بنجاح.',
      data: this.serializeSection(updated),
    };
  }

  async remove(id: number, adminId?: number, ipAddress?: string, userAgent?: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: BigInt(id) },
      include: {
        class_sections: { take: 1 },
      },
    });

    if (!section || section.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الشعبة العامة غير موجودة.',
      });
    }

    // RESTRICT: cannot delete if linked to class_sections
    if (section.class_sections.length > 0) {
      throw new ConflictException({
        success: false,
        message: 'لا يمكن حذف الشعبة العامة لاستخدامها في صفوف دراسية (RESTRICT).',
      });
    }

    const deleted = await this.prisma.section.update({
      where: { id: section.id },
      data: { deleted_at: new Date() },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'section_deleted',
        entityType: 'Section',
        entityId: deleted.id,
        oldValues: { name: section.name },
        newValues: { deleted_at: deleted.deleted_at },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم حذف الشعبة العامة بنجاح.',
    };
  }
}
