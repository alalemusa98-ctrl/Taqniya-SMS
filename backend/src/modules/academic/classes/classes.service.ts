import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateClassDto } from './dto/create-class.dto.js';
import { UpdateClassDto } from './dto/update-class.dto.js';
import { QueryClassesDto } from './dto/query-classes.dto.js';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeClass(c: any) {
    return {
      id: Number(c.id),
      stage_id: Number(c.stage_id),
      stage_name: c.stage ? c.stage.name : undefined,
      name: c.name,
      grade_level: Number(c.grade_level),
      max_second_round_subjects: c.max_second_round_subjects !== undefined && c.max_second_round_subjects !== null ? Number(c.max_second_round_subjects) : 3,
      created_at: c.created_at ? c.created_at.toISOString() : null,
      updated_at: c.updated_at ? c.updated_at.toISOString() : null,
      deleted_at: c.deleted_at ? c.deleted_at.toISOString() : null,
    };
  }

  async findAll(query: QueryClassesDto = {}) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.stage_id) {
      where.stage_id = BigInt(query.stage_id);
    }

    if (query.grade_level) {
      where.grade_level = Number(query.grade_level);
    }

    if (query.search) {
      where.name = {
        contains: query.search,
      };
    }

    const orderByField = query.sort_by === 'name' ? 'name' : query.sort_by === 'id' ? 'id' : 'grade_level';
    const orderByDirection = query.sort_order === 'desc' ? 'desc' : 'asc';

    const [total, classes] = await Promise.all([
      this.prisma.class.count({ where }),
      this.prisma.class.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [orderByField]: orderByDirection },
        include: {
          stage: {
            select: { name: true },
          },
        },
      }),
    ]);

    return {
      success: true,
      message: total > 0 ? 'تم جلب قائمة الصفوف الدراسية بنجاح.' : 'لا توجد صفوف دراسية مسجلة.',
      data: classes.map((c) => this.serializeClass(c)),
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findOne(id: number) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: BigInt(id) },
      include: {
        stage: {
          select: { name: true },
        },
      },
    });

    if (!classItem || classItem.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الصف الدراسي غير موجود.',
      });
    }

    return {
      success: true,
      data: this.serializeClass(classItem),
    };
  }

  async create(dto: CreateClassDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    if (dto.grade_level < 1 || dto.grade_level > 12) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'المستوى الأكاديمي الرقمي يجب أن يكون بين 1 و 12.',
      });
    }

    // Verify stage exists
    const stage = await this.prisma.academicStage.findUnique({
      where: { id: BigInt(dto.stage_id) },
    });

    if (!stage || stage.deleted_at !== null) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'المرحلة الدراسية المحددة غير موجودة.',
      });
    }

    // Verify unique (stage_id, grade_level)
    const existing = await this.prisma.class.findFirst({
      where: {
        stage_id: BigInt(dto.stage_id),
        grade_level: dto.grade_level,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        message: 'المستوى الرقمي للصف مكرر بالفعل داخل هذه المرحلة التعليمية.',
      });
    }

    const created = await this.prisma.class.create({
      data: {
        stage_id: BigInt(dto.stage_id),
        name: dto.name,
        grade_level: dto.grade_level,
        ...(dto.max_second_round_subjects !== undefined && {
          max_second_round_subjects: dto.max_second_round_subjects,
        }),
      },
      include: {
        stage: { select: { name: true } },
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'class_created',
        entityType: 'Class',
        entityId: created.id,
        newValues: {
          stage_id: dto.stage_id,
          name: created.name,
          grade_level: created.grade_level,
          max_second_round_subjects: created.max_second_round_subjects,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم إنشاء الصف الدراسي وتسكينه بالمرحلة بنجاح.',
      data: this.serializeClass(created),
    };
  }

  async update(id: number, dto: UpdateClassDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: BigInt(id) },
    });

    if (!classItem || classItem.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الصف الدراسي غير موجود.',
      });
    }

    const targetStageId = dto.stage_id ? BigInt(dto.stage_id) : classItem.stage_id;
    const targetGradeLevel = dto.grade_level !== undefined ? dto.grade_level : classItem.grade_level;

    if (dto.grade_level !== undefined && (dto.grade_level < 1 || dto.grade_level > 12)) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'المستوى الأكاديمي الرقمي يجب أن يكون بين 1 و 12.',
      });
    }

    if (dto.stage_id && dto.stage_id !== Number(classItem.stage_id)) {
      const stage = await this.prisma.academicStage.findUnique({
        where: { id: targetStageId },
      });
      if (!stage || stage.deleted_at !== null) {
        throw new UnprocessableEntityException({
          success: false,
          message: 'المرحلة الدراسية المحددة غير موجودة.',
        });
      }
    }

    if (
      dto.grade_level !== undefined &&
      (targetStageId !== classItem.stage_id || targetGradeLevel !== classItem.grade_level)
    ) {
      const duplicate = await this.prisma.class.findFirst({
        where: {
          stage_id: targetStageId,
          grade_level: targetGradeLevel,
          deleted_at: null,
          NOT: { id: classItem.id },
        },
      });

      if (duplicate) {
        throw new ConflictException({
          success: false,
          message: 'المستوى الرقمي للصف مكرر بالفعل داخل هذه المرحلة التعليمية.',
        });
      }
    }

    const oldValues = {
      stage_id: Number(classItem.stage_id),
      name: classItem.name,
      grade_level: classItem.grade_level,
      max_second_round_subjects: classItem.max_second_round_subjects !== null ? Number(classItem.max_second_round_subjects) : 3,
    };

    const updated = await this.prisma.class.update({
      where: { id: classItem.id },
      data: {
        ...(dto.stage_id && { stage_id: BigInt(dto.stage_id) }),
        ...(dto.name && { name: dto.name }),
        ...(dto.grade_level !== undefined && { grade_level: dto.grade_level }),
        ...(dto.max_second_round_subjects !== undefined && {
          max_second_round_subjects: dto.max_second_round_subjects,
        }),
      },
      include: {
        stage: { select: { name: true } },
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'class_updated',
        entityType: 'Class',
        entityId: updated.id,
        oldValues,
        newValues: {
          ...(dto.stage_id && { stage_id: dto.stage_id }),
          ...(dto.name && { name: dto.name }),
          ...(dto.grade_level !== undefined && { grade_level: dto.grade_level }),
          ...(dto.max_second_round_subjects !== undefined && {
            max_second_round_subjects: dto.max_second_round_subjects,
          }),
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم تحديث الصف الدراسي بنجاح.',
      data: this.serializeClass(updated),
    };
  }

  async remove(id: number, adminId?: number, ipAddress?: string, userAgent?: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: BigInt(id) },
      include: {
        class_academic_terms: { take: 1 },
        class_sections: { take: 1 },
        class_subjects: { take: 1 },
        student_enrollments: { take: 1 },
        official_exams: { take: 1 },
      },
    });

    if (!classItem || classItem.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الصف الدراسي غير موجود.',
      });
    }

    // RESTRICT protection: verify no dependent records
    if (
      classItem.class_academic_terms.length > 0 ||
      classItem.class_sections.length > 0 ||
      classItem.class_subjects.length > 0 ||
      classItem.student_enrollments.length > 0 ||
      classItem.official_exams.length > 0
    ) {
      throw new ConflictException({
        success: false,
        message: 'لا يمكن حذف الصف الدراسي لارتباطه بفترات صفوف أو شُعب أو مقررات مسندة (RESTRICT).',
      });
    }

    const deleted = await this.prisma.class.update({
      where: { id: classItem.id },
      data: { deleted_at: new Date() },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'class_deleted',
        entityType: 'Class',
        entityId: deleted.id,
        oldValues: {
          stage_id: Number(classItem.stage_id),
          name: classItem.name,
          grade_level: classItem.grade_level,
        },
        newValues: { deleted_at: deleted.deleted_at },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم حذف الصف الدراسي بنجاح.',
    };
  }
}
