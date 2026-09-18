import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateAcademicTermDto } from './dto/create-term.dto.js';
import { UpdateAcademicTermDto } from './dto/update-term.dto.js';
import { QueryAcademicTermsDto } from './dto/query-terms.dto.js';

@Injectable()
export class TermsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeTerm(term: any) {
    return {
      id: Number(term.id),
      name: term.name,
      term_number: Number(term.term_number),
      created_at: term.created_at ? term.created_at.toISOString() : null,
      updated_at: term.updated_at ? term.updated_at.toISOString() : null,
      deleted_at: term.deleted_at ? term.deleted_at.toISOString() : null,
    };
  }

  async findAll(query: QueryAcademicTermsDto = {}) {
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

    const sortBy = query.sort_by || 'term_number';
    const sortOrder = query.sort_order === 'desc' ? 'desc' : 'asc';

    const [total, terms] = await Promise.all([
      this.prisma.academicTerm.count({ where }),
      this.prisma.academicTerm.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      success: true,
      message: total > 0 ? 'تم جلب كتالوج الفترات المعيارية بنجاح.' : 'لا توجد فترات مسجلة بالكتالوج.',
      data: terms.map((t) => this.serializeTerm(t)),
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findOne(id: number) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id: BigInt(id) },
    });

    if (!term || term.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الفترة غير موجودة بالكتالوج.',
      });
    }

    return {
      success: true,
      data: this.serializeTerm(term),
    };
  }

  async create(dto: CreateAcademicTermDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const existingName = await this.prisma.academicTerm.findFirst({
      where: {
        name: dto.name,
        deleted_at: null,
      },
    });

    if (existingName) {
      throw new ConflictException({
        success: false,
        message: 'اسم الفترة أو رقم الترتيب موجود مسبقاً بالكتالوج (uq_terms_name, uq_terms_number).',
      });
    }

    const existingNumber = await this.prisma.academicTerm.findFirst({
      where: {
        term_number: dto.term_number,
        deleted_at: null,
      },
    });

    if (existingNumber) {
      throw new ConflictException({
        success: false,
        message: 'اسم الفترة أو رقم الترتيب موجود مسبقاً بالكتالوج (uq_terms_name, uq_terms_number).',
      });
    }

    let created;
    try {
      created = await this.prisma.academicTerm.create({
        data: {
          name: dto.name,
          term_number: dto.term_number,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException({
          success: false,
          message: 'اسم الفترة أو رقم الترتيب موجود مسبقاً بالكتالوج (uq_terms_name, uq_terms_number).',
        });
      }
      throw err;
    }

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_term_created',
        entityType: 'AcademicTerm',
        entityId: created.id,
        newValues: {
          name: created.name,
          term_number: created.term_number,
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تمت إضافة الفترة للكتالوج العام بنجاح.',
      data: {
        id: Number(created.id),
        name: created.name,
        term_number: Number(created.term_number),
      },
    };
  }

  async update(id: number, dto: UpdateAcademicTermDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id: BigInt(id) },
    });

    if (!term || term.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الفترة غير موجودة بالكتالوج.',
      });
    }

    if (dto.name && dto.name !== term.name) {
      const duplicateName = await this.prisma.academicTerm.findFirst({
        where: {
          name: dto.name,
          deleted_at: null,
          NOT: { id: term.id },
        },
      });

      if (duplicateName) {
        throw new ConflictException({
          success: false,
          message: 'اسم الفترة أو رقم الترتيب مستخدم مسبقاً لفترة أخرى.',
        });
      }
    }

    if (dto.term_number !== undefined && dto.term_number !== term.term_number) {
      const duplicateNumber = await this.prisma.academicTerm.findFirst({
        where: {
          term_number: dto.term_number,
          deleted_at: null,
          NOT: { id: term.id },
        },
      });

      if (duplicateNumber) {
        throw new ConflictException({
          success: false,
          message: 'اسم الفترة أو رقم الترتيب مستخدم مسبقاً لفترة أخرى.',
        });
      }
    }

    const oldValues = {
      name: term.name,
      term_number: term.term_number,
    };

    const updated = await this.prisma.academicTerm.update({
      where: { id: term.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.term_number !== undefined && { term_number: dto.term_number }),
      },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_term_updated',
        entityType: 'AcademicTerm',
        entityId: updated.id,
        oldValues,
        newValues: {
          ...(dto.name && { name: dto.name }),
          ...(dto.term_number !== undefined && { term_number: dto.term_number }),
        },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم تحديث الفترة بنجاح.',
      data: {
        id: Number(updated.id),
        name: updated.name,
        term_number: Number(updated.term_number),
      },
    };
  }

  async remove(id: number, adminId?: number, ipAddress?: string, userAgent?: string) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id: BigInt(id) },
      include: {
        class_academic_terms: { take: 1 },
        assignments: { take: 1 },
        quizzes: { take: 1 },
        official_exams: { take: 1 },
      },
    });

    if (!term || term.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الفترة المراد حذفها غير موجودة بالكتالوج.',
      });
    }

    // RESTRICT protection: verify no dependencies exist
    if (
      term.class_academic_terms.length > 0 ||
      term.assignments.length > 0 ||
      term.quizzes.length > 0 ||
      term.official_exams.length > 0
    ) {
      throw new ConflictException({
        success: false,
        message: 'لا يمكن حذف الفترة المرجعية لارتباطها بتخصيصات صفوف (RESTRICT).',
      });
    }

    const deleted = await this.prisma.academicTerm.update({
      where: { id: term.id },
      data: { deleted_at: new Date() },
    });

    if (adminId) {
      await this.auditService.log({
        userId: BigInt(adminId),
        action: 'academic_term_deleted',
        entityType: 'AcademicTerm',
        entityId: deleted.id,
        oldValues: { name: term.name, term_number: term.term_number },
        newValues: { deleted_at: deleted.deleted_at },
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: 'تم حذف الفترة من الكتالوج بنجاح.',
    };
  }
}
