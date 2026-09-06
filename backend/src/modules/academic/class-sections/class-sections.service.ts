import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateClassSectionDto } from './dto/create-class-section.dto.js';
import { QueryClassSectionsDto } from './dto/query-class-sections.dto.js';

@Injectable()
export class ClassSectionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeClassSection(item: any) {
    return {
      id: Number(item.id),
      class_id: Number(item.class_id),
      class_name: item.class ? item.class.name : undefined,
      section_id: Number(item.section_id),
      section_name: item.section ? item.section.name : undefined,
      created_at: item.created_at ? item.created_at.toISOString() : null,
      updated_at: item.updated_at ? item.updated_at.toISOString() : null,
      deleted_at: item.deleted_at ? item.deleted_at.toISOString() : null,
    };
  }

  async findAll(query: QueryClassSectionsDto = {}) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 15;
    const skip = (page - 1) * perPage;

    const classWhere: any = {
      deleted_at: null,
    };

    if (query.class_id) {
      classWhere.id = BigInt(query.class_id);
    }

    if (query.search) {
      classWhere.name = {
        contains: query.search,
      };
    }

    const sectionWhere: any = {
      deleted_at: null,
    };

    const [totalClasses, classes] = await Promise.all([
      this.prisma.class.count({
        where: {
          ...classWhere,
          class_sections: {
            some: sectionWhere,
          },
        },
      }),
      this.prisma.class.findMany({
        where: {
          ...classWhere,
          class_sections: {
            some: sectionWhere,
          },
        },
        include: {
          class_sections: {
            where: sectionWhere,
            include: {
              section: true,
            },
            orderBy: {
              section_id: 'asc',
            },
          },
        },
        skip,
        take: perPage,
        orderBy: {
          grade_level: 'asc',
        },
      }),
    ]);

    const formattedClasses = classes.map((c) => ({
      class_id: Number(c.id),
      class_name: c.name,
      sections_count: c.class_sections.length,
      sections: c.class_sections.map((cs) => ({
        id: Number(cs.id),
        section_id: Number(cs.section_id),
        name: cs.section?.name,
      })),
    }));

    const message =
      formattedClasses.length === 0
        ? 'لا توجد شعب مسجلة تطابق محددات البحث.'
        : 'تم جلب شعب الصفوف الدراسية بنجاح.';

    return {
      success: true,
      message,
      data: {
        classes: formattedClasses,
      },
      meta: {
        current_page: page,
        per_page: perPage,
        total: totalClasses,
        last_page: Math.ceil(totalClasses / perPage) || 1,
      },
    };
  }

  async findOne(id: number) {
    const record = await this.prisma.classSection.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class: true,
        section: true,
      },
    });

    if (!record) {
      throw new NotFoundException('سجل تسكين الشعبة غير موجود.');
    }

    return {
      success: true,
      message: 'تم جلب تفاصيل تسكين الشعبة بنجاح.',
      data: this.serializeClassSection(record),
    };
  }

  async create(
    dto: CreateClassSectionDto,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Verify class exists
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: BigInt(dto.class_id),
        deleted_at: null,
      },
    });

    if (!classRecord) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التسكين غير صالحة.',
        errors: { class_id: ['الصف الدراسي المحدد غير موجود.'] },
      });
    }

    // 2. Verify section exists
    const sectionRecord = await this.prisma.section.findFirst({
      where: {
        id: BigInt(dto.section_id),
        deleted_at: null,
      },
    });

    if (!sectionRecord) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التسكين غير صالحة.',
        errors: { section_id: ['الشعبة العامة المحددة غير موجودة.'] },
      });
    }

    // 3. Check uniqueness (uq_class_sections)
    const existing = await this.prisma.classSection.findFirst({
      where: {
        class_id: BigInt(dto.class_id),
        section_id: BigInt(dto.section_id),
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException('الشعبة مفتوحة ومسندة مسبقاً لهذا الصف (uq_class_sections).');
    }

    // 4. Create record
    const created = await this.prisma.classSection.create({
      data: {
        class_id: BigInt(dto.class_id),
        section_id: BigInt(dto.section_id),
      },
      include: {
        class: true,
        section: true,
      },
    });

    const serialized = this.serializeClassSection(created);

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'create',
      entityType: 'class_sections',
      entityId: BigInt(serialized.id),
      newValues: serialized,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم فتح وتسكين الشعبة للصف بنجاح.',
      data: {
        id: serialized.id,
        class_id: serialized.class_id,
        class_name: serialized.class_name,
        section_id: serialized.section_id,
        section_name: serialized.section_name,
      },
    };
  }

  async remove(
    id: number,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.classSection.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class: true,
        section: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('سجل تسكين الشعبة المراد حذفه غير موجود.');
    }

    // Check RESTRICT: enrolled students
    const enrolledStudentsCount = await this.prisma.studentEnrollment.count({
      where: {
        class_section_id: BigInt(id),
        deleted_at: null,
      },
    });

    if (enrolledStudentsCount > 0) {
      throw new ConflictException(
        'لا يمكن فك ربط الشعبة لوجود طلاب مسجلين بها في جدول تسكين الطلاب (RESTRICT).',
      );
    }

    // Check RESTRICT: teaching assignments
    const teachingAssignmentsCount = await this.prisma.teachingAssignment.count({
      where: {
        class_section_id: BigInt(id),
        deleted_at: null,
      },
    });

    if (teachingAssignmentsCount > 0) {
      throw new ConflictException(
        'لا يمكن فك ربط الشعبة لوجود معلمين مسندين لتدريسها (RESTRICT).',
      );
    }

    const deleted = await this.prisma.classSection.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: new Date(),
      },
    });

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'delete',
      entityType: 'class_sections',
      entityId: BigInt(id),
      oldValues: this.serializeClassSection(existing),
      newValues: { deleted_at: deleted.deleted_at },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم فك ربط الشعبة من الصف بنجاح.',
    };
  }
}
