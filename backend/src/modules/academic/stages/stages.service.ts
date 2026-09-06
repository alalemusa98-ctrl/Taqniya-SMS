import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateAcademicStageDto } from './dto/create-stage.dto.js';
import { UpdateAcademicStageDto } from './dto/update-stage.dto.js';

@Injectable()
export class StagesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeStage(stage: any) {
    return {
      id: Number(stage.id),
      name: stage.name,
      order_index: Number(stage.order_index),
      created_at: stage.created_at ? stage.created_at.toISOString() : null,
      updated_at: stage.updated_at ? stage.updated_at.toISOString() : null,
      deleted_at: stage.deleted_at ? stage.deleted_at.toISOString() : null,
    };
  }

  async findAll() {
    const stages = await this.prisma.academicStage.findMany({
      where: { deleted_at: null },
      orderBy: { order_index: 'asc' },
    });

    return {
      success: true,
      data: stages.map((s) => this.serializeStage(s)),
    };
  }

  async findOne(id: number) {
    const stage = await this.prisma.academicStage.findUnique({
      where: { id: BigInt(id) },
    });

    if (!stage || stage.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'المرحلة الدراسية غير موجودة.',
      });
    }

    return {
      success: true,
      data: this.serializeStage(stage),
    };
  }

  async create(dto: CreateAcademicStageDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const existingName = await this.prisma.academicStage.findFirst({
      where: {
        name: dto.name,
        deleted_at: null,
      },
    });

    if (existingName) {
      throw new ConflictException({
        success: false,
        message: 'اسم المرحلة الدراسية موجود مسبقاً.',
      });
    }

    const created = await this.prisma.academicStage.create({
      data: {
        name: dto.name,
        order_index: dto.order_index,
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_stage_created',
        entityType: 'AcademicStage',
        entityId: created.id,
        newValues: {
          name: created.name,
          order_index: created.order_index,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم إنشاء المرحلة الدراسية بنجاح.',
      data: this.serializeStage(created),
    };
  }

  async update(id: number, dto: UpdateAcademicStageDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const stage = await this.prisma.academicStage.findUnique({
      where: { id: BigInt(id) },
    });

    if (!stage || stage.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'المرحلة الدراسية غير موجودة.',
      });
    }

    if (dto.name && dto.name !== stage.name) {
      const duplicateName = await this.prisma.academicStage.findFirst({
        where: {
          name: dto.name,
          deleted_at: null,
          NOT: { id: stage.id },
        },
      });

      if (duplicateName) {
        throw new ConflictException({
          success: false,
          message: 'اسم المرحلة الدراسية موجود مسبقاً.',
        });
      }
    }

    const oldValues = {
      name: stage.name,
      order_index: stage.order_index,
    };

    const updated = await this.prisma.academicStage.update({
      where: { id: stage.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.order_index !== undefined && { order_index: dto.order_index }),
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_stage_updated',
        entityType: 'AcademicStage',
        entityId: updated.id,
        oldValues,
        newValues: {
          ...(dto.name && { name: dto.name }),
          ...(dto.order_index !== undefined && { order_index: dto.order_index }),
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم تحديث بيانات المرحلة الدراسية بنجاح.',
      data: this.serializeStage(updated),
    };
  }

  async remove(id: number, adminId?: number, ipAddress?: string, userAgent?: string) {
    const stage = await this.prisma.academicStage.findUnique({
      where: { id: BigInt(id) },
      include: {
        classes: { take: 1 },
      },
    });

    if (!stage || stage.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'المرحلة الدراسية غير موجودة.',
      });
    }

    // RESTRICT protection: verify no classes linked to this stage
    if (stage.classes.length > 0) {
      throw new ConflictException({
        success: false,
        message: 'لا يمكن حذف المرحلة الدراسية لوجود صفوف دراسية مرتبطة بها.',
      });
    }

    const deleted = await this.prisma.academicStage.update({
      where: { id: stage.id },
      data: { deleted_at: new Date() },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_stage_deleted',
        entityType: 'AcademicStage',
        entityId: deleted.id,
        oldValues: { name: stage.name, order_index: stage.order_index },
        newValues: { deleted_at: deleted.deleted_at },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم حذف المرحلة الدراسية بنجاح.',
    };
  }
}
