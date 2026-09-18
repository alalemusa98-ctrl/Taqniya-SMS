import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { QuerySubjectsDto } from './dto/query-subjects.dto.js';

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeSubject(s: any) {
    return {
      id: Number(s.id),
      name: s.name,
      code: s.code || null,
      created_at: s.created_at ? s.created_at.toISOString() : null,
      updated_at: s.updated_at ? s.updated_at.toISOString() : null,
      deleted_at: s.deleted_at ? s.deleted_at.toISOString() : null,
    };
  }

  async findAll(query: QuerySubjectsDto = {}) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { code: { contains: query.search } },
      ];
    }

    if (query.code) {
      where.code = query.code;
    }

    const orderByField = query.sort_by === 'id' ? 'id' : query.sort_by === 'code' ? 'code' : 'name';
    const orderByDirection = query.sort_order === 'desc' ? 'desc' : 'asc';

    const [total, subjects] = await Promise.all([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [orderByField]: orderByDirection },
      }),
    ]);

    return {
      success: true,
      message: total > 0 ? 'تم جلب بنك المواد العامة بنجاح.' : 'لا توجد مواد مسجلة ببنك المواد.',
      data: subjects.map((s) => this.serializeSubject(s)),
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: BigInt(id) },
    });

    if (!subject || subject.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'المادة غير موجودة.',
      });
    }

    return {
      success: true,
      data: this.serializeSubject(subject),
    };
  }

  async create(dto: CreateSubjectDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    // Check duplicate name
    const existingName = await this.prisma.subject.findFirst({
      where: {
        name: dto.name,
        deleted_at: null,
      },
    });

    if (existingName) {
      throw new ConflictException({
        success: false,
        message: 'اسم المادة التعليمية موجود مسبقاً في بنك المواد.',
      });
    }

    // Check duplicate code if provided
    if (dto.code && dto.code.trim()) {
      const existingCode = await this.prisma.subject.findFirst({
        where: {
          code: dto.code.trim(),
          deleted_at: null,
        },
      });

      if (existingCode) {
        throw new ConflictException({
          success: false,
          message: 'الكود الرمزي للمادة موجود مسبقاً لمادة أخرى.',
        });
      }
    }

    const created = await this.prisma.subject.create({
      data: {
        name: dto.name,
        code: dto.code ? dto.code.trim() : null,
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'subject_created',
        entityType: 'Subject',
        entityId: created.id,
        newValues: {
          name: created.name,
          code: created.code,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تمت إضافة المادة لبنك المواد بنجاح.',
      data: this.serializeSubject(created),
    };
  }

  async update(id: number, dto: UpdateSubjectDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: BigInt(id) },
    });

    if (!subject || subject.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'المادة التعليمية غير موجودة.',
      });
    }

    if (dto.name && dto.name !== subject.name) {
      const duplicateName = await this.prisma.subject.findFirst({
        where: {
          name: dto.name,
          deleted_at: null,
          NOT: { id: subject.id },
        },
      });

      if (duplicateName) {
        throw new ConflictException({
          success: false,
          message: 'اسم المادة التعليمية موجود مسبقاً في بنك المواد.',
        });
      }
    }

    if (dto.code && dto.code !== subject.code) {
      const duplicateCode = await this.prisma.subject.findFirst({
        where: {
          code: dto.code.trim(),
          deleted_at: null,
          NOT: { id: subject.id },
        },
      });

      if (duplicateCode) {
        throw new ConflictException({
          success: false,
          message: 'الكود الرمزي للمادة موجود مسبقاً لمادة أخرى.',
        });
      }
    }

    const oldValues = {
      name: subject.name,
      code: subject.code,
    };

    const updated = await this.prisma.subject.update({
      where: { id: subject.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code ? dto.code.trim() : null }),
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'subject_updated',
        entityType: 'Subject',
        entityId: updated.id,
        oldValues,
        newValues: {
          ...(dto.name && { name: dto.name }),
          ...(dto.code !== undefined && { code: dto.code ? dto.code.trim() : null }),
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم تحديث المادة بنجاح.',
      data: this.serializeSubject(updated),
    };
  }

  async remove(id: number, adminId?: number, ipAddress?: string, userAgent?: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: BigInt(id) },
      include: {
        class_subjects: { take: 1 },
        teaching_assignments: { take: 1 },
        official_exams: { take: 1 },
      },
    });

    if (!subject || subject.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'المادة المراد حذفها غير موجودة بالبنك.',
      });
    }

    // RESTRICT: cannot delete if linked to class_subjects, teaching_assignments, official_exams
    if (
      subject.class_subjects.length > 0 ||
      subject.teaching_assignments.length > 0 ||
      subject.official_exams.length > 0
    ) {
      throw new ConflictException({
        success: false,
        message: 'لا يمكن حذف المادة لإسنادها في مناهج ومقررات صفوف دراسية (RESTRICT).',
      });
    }

    const deleted = await this.prisma.subject.update({
      where: { id: subject.id },
      data: { deleted_at: new Date() },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'subject_deleted',
        entityType: 'Subject',
        entityId: deleted.id,
        oldValues: { name: subject.name, code: subject.code },
        newValues: { deleted_at: deleted.deleted_at },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم حذف المادة من البنك بنجاح.',
    };
  }
}
