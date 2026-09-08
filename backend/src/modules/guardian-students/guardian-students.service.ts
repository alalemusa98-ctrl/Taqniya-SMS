import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateGuardianStudentDto } from './dto/create-guardian-student.dto.js';
import { UpdateGuardianStudentDto } from './dto/update-guardian-student.dto.js';

@Injectable()
export class GuardianStudentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    dto: CreateGuardianStudentDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: BigInt(dto.guardian_id) },
    });
    if (!guardian || guardian.deleted_at !== null) {
      throw new BadRequestException({
        success: false,
        message: 'معرف ولي الأمر غير موجود.',
      });
    }

    const student = await this.prisma.student.findUnique({
      where: { id: BigInt(dto.student_id) },
    });
    if (!student || student.deleted_at !== null) {
      throw new BadRequestException({
        success: false,
        message: 'معرف الطالب غير موجود.',
      });
    }

    // Check unique link (uq_guardian_student)
    const existing = await this.prisma.guardianStudent.findFirst({
      where: {
        guardian_id: BigInt(dto.guardian_id),
        student_id: BigInt(dto.student_id),
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        message:
          'رابط الوصاية بين ولي الأمر وهذا الطالب مسجل مسبقاً (uq_guardian_student).',
      });
    }

    const custody = await this.prisma.guardianStudent.create({
      data: {
        guardian_id: BigInt(dto.guardian_id),
        student_id: BigInt(dto.student_id),
        is_primary: dto.is_primary !== undefined ? dto.is_primary : 1,
      },
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'custody_linked',
      entityType: 'GuardianStudent',
      entityId: custody.id,
      newValues: {
        id: Number(custody.id),
        guardian_id: dto.guardian_id,
        student_id: dto.student_id,
        is_primary: custody.is_primary,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم ربط وصاية ولي الأمر بالطالب بنجاح.',
      data: {
        id: Number(custody.id),
        guardian_id: Number(custody.guardian_id),
        student_id: Number(custody.student_id),
        is_primary: custody.is_primary,
        created_at: custody.created_at.toISOString(),
      },
    };
  }

  async update(
    id: number,
    dto: UpdateGuardianStudentDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const custody = await this.prisma.guardianStudent.findUnique({
      where: { id: BigInt(id) },
    });

    if (!custody || custody.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'رابط الوصاية غير موجود.',
      });
    }

    const newGuardianId = dto.guardian_id ? BigInt(dto.guardian_id) : custody.guardian_id;
    const newStudentId = dto.student_id ? BigInt(dto.student_id) : custody.student_id;

    if (dto.guardian_id || dto.student_id) {
      const duplicate = await this.prisma.guardianStudent.findFirst({
        where: {
          guardian_id: newGuardianId,
          student_id: newStudentId,
          deleted_at: null,
          NOT: { id: custody.id },
        },
      });
      if (duplicate) {
        throw new ConflictException({
          success: false,
          message:
            'رابط الوصاية بين ولي الأمر وهذا الطالب مسجل مسبقاً (uq_guardian_student).',
        });
      }
    }

    const updated = await this.prisma.guardianStudent.update({
      where: { id: BigInt(id) },
      data: {
        guardian_id: dto.guardian_id ? BigInt(dto.guardian_id) : undefined,
        student_id: dto.student_id ? BigInt(dto.student_id) : undefined,
        is_primary: dto.is_primary !== undefined ? dto.is_primary : undefined,
      },
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'custody_updated',
      entityType: 'GuardianStudent',
      entityId: custody.id,
      oldValues: {
        guardian_id: Number(custody.guardian_id),
        student_id: Number(custody.student_id),
        is_primary: custody.is_primary,
      },
      newValues: {
        guardian_id: Number(updated.guardian_id),
        student_id: Number(updated.student_id),
        is_primary: updated.is_primary,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث بيانات رابط الوصاية بنجاح.',
      data: {
        id: Number(updated.id),
        guardian_id: Number(updated.guardian_id),
        student_id: Number(updated.student_id),
        is_primary: updated.is_primary,
      },
    };
  }

  async delete(
    id: number,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const custody = await this.prisma.guardianStudent.findUnique({
      where: { id: BigInt(id) },
    });

    if (!custody || custody.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'رابط الوصاية غير موجود.',
      });
    }

    await this.prisma.guardianStudent.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'custody_deleted',
      entityType: 'GuardianStudent',
      entityId: custody.id,
      oldValues: {
        id: Number(custody.id),
        guardian_id: Number(custody.guardian_id),
        student_id: Number(custody.student_id),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم فك وإلغاء رابط الوصاية بنجاح.',
    };
  }
}
