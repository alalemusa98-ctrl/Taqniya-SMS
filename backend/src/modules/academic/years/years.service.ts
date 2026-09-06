import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateAcademicYearDto } from './dto/create-year.dto.js';
import { UpdateAcademicYearDto } from './dto/update-year.dto.js';
import { QueryAcademicYearsDto } from './dto/query-years.dto.js';

@Injectable()
export class YearsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeYear(year: any) {
    return {
      id: Number(year.id),
      name: year.name,
      start_date: year.start_date instanceof Date ? year.start_date.toISOString().split('T')[0] : year.start_date,
      end_date: year.end_date instanceof Date ? year.end_date.toISOString().split('T')[0] : year.end_date,
      is_active: Number(year.is_active),
      created_at: year.created_at ? year.created_at.toISOString() : null,
      updated_at: year.updated_at ? year.updated_at.toISOString() : null,
      deleted_at: year.deleted_at ? year.deleted_at.toISOString() : null,
    };
  }

  async findAll(query: QueryAcademicYearsDto = {}) {
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

    if (query.is_active !== undefined && !isNaN(Number(query.is_active))) {
      where.is_active = Number(query.is_active);
    }

    const [total, years] = await Promise.all([
      this.prisma.academicYear.count({ where }),
      this.prisma.academicYear.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { start_date: 'desc' },
      }),
    ]);

    return {
      success: true,
      data: years.map((y) => this.serializeYear(y)),
      meta: {
        total,
        page,
        per_page: perPage,
        last_page: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findOne(id: number) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(id) },
    });

    if (!year || year.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'السنة الدراسية غير موجودة.',
      });
    }

    return {
      success: true,
      data: this.serializeYear(year),
    };
  }

  async create(dto: CreateAcademicYearDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (endDate <= startDate) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'تاريخ نهاية السنة الدراسية يجب أن يكون بعد تاريخ البداية.',
      });
    }

    const existing = await this.prisma.academicYear.findFirst({
      where: {
        name: dto.name,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'اسم السنة الدراسية موجود مسبقاً.',
      });
    }

    const created = await this.prisma.academicYear.create({
      data: {
        name: dto.name,
        start_date: startDate,
        end_date: endDate,
        is_active: 0,
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_year_created',
        entityType: 'AcademicYear',
        entityId: created.id,
        newValues: {
          name: created.name,
          start_date: dto.start_date,
          end_date: dto.end_date,
          is_active: 0,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم إنشاء السنة الدراسية بنجاح.',
      data: this.serializeYear(created),
    };
  }

  async update(id: number, dto: UpdateAcademicYearDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(id) },
    });

    if (!year || year.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'السنة الدراسية غير موجودة.',
      });
    }

    const startDate = dto.start_date ? new Date(dto.start_date) : year.start_date;
    const endDate = dto.end_date ? new Date(dto.end_date) : year.end_date;

    if (endDate <= startDate) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'تاريخ نهاية السنة الدراسية يجب أن يكون بعد تاريخ البداية.',
      });
    }

    if (dto.name && dto.name !== year.name) {
      const duplicate = await this.prisma.academicYear.findFirst({
        where: {
          name: dto.name,
          deleted_at: null,
          NOT: { id: year.id },
        },
      });

      if (duplicate) {
        throw new ConflictException({
          success: false,
          message: 'اسم السنة الدراسية موجود مسبقاً.',
        });
      }
    }

    const oldValues = {
      name: year.name,
      start_date: year.start_date.toISOString().split('T')[0],
      end_date: year.end_date.toISOString().split('T')[0],
    };

    const updated = await this.prisma.academicYear.update({
      where: { id: year.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_year_updated',
        entityType: 'AcademicYear',
        entityId: updated.id,
        oldValues,
        newValues: {
          ...(dto.name && { name: dto.name }),
          ...(dto.start_date && { start_date: dto.start_date }),
          ...(dto.end_date && { end_date: dto.end_date }),
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم تحديث بيانات السنة الدراسية بنجاح.',
      data: this.serializeYear(updated),
    };
  }

  async activate(id: number, adminId?: number, ipAddress?: string, userAgent?: string) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(id) },
    });

    if (!year || year.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'السنة الدراسية غير موجودة.',
      });
    }

    // Atomic transaction: Reset all active years, then activate this one
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { deleted_at: null },
        data: { is_active: 0 },
      });

      return await tx.academicYear.update({
        where: { id: year.id },
        data: { is_active: 1 },
      });
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_year_activated',
        entityType: 'AcademicYear',
        entityId: updated.id,
        oldValues: { is_active: year.is_active },
        newValues: { is_active: 1 },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم تفعيل السنة الدراسية بنجاح واعتمادها كسنة حالية.',
      data: this.serializeYear(updated),
    };
  }

  async remove(id: number, adminId?: number, ipAddress?: string, userAgent?: string) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: BigInt(id) },
      include: {
        student_enrollments: { take: 1 },
        teaching_assignments: { take: 1 },
      },
    });

    if (!year || year.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'السنة الدراسية غير موجودة.',
      });
    }

    // RESTRICT rule: verify no dependencies exist
    if (year.student_enrollments.length > 0 || year.teaching_assignments.length > 0) {
      throw new ConflictException({
        success: false,
        message: 'لا يمكن حذف السنة الدراسية لوجود تسجيلات طلاب أو جداول تدريس مرتبطة بها.',
      });
    }

    const deleted = await this.prisma.academicYear.update({
      where: { id: year.id },
      data: { deleted_at: new Date() },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_year_deleted',
        entityType: 'AcademicYear',
        entityId: deleted.id,
        oldValues: { name: year.name, is_active: year.is_active },
        newValues: { deleted_at: deleted.deleted_at },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم حذف السنة الدراسية بنجاح.',
    };
  }
}
