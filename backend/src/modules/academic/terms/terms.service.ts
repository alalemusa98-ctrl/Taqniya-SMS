import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateAcademicTermDto } from './dto/create-term.dto.js';
import { UpdateAcademicTermDto } from './dto/update-term.dto.js';

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

  async findAll() {
    const terms = await this.prisma.academicTerm.findMany({
      where: { deleted_at: null },
      orderBy: { term_number: 'asc' },
    });

    return {
      success: true,
      data: terms.map((t) => this.serializeTerm(t)),
    };
  }

  async findOne(id: number) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id: BigInt(id) },
    });

    if (!term || term.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الفصل الدراسي غير موجود.',
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
        message: 'اسم الفصل الدراسي موجود مسبقاً في الكتالوج.',
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
        message: 'رقم الفصل الدراسي الترتيبي موجود مسبقاً.',
      });
    }

    const created = await this.prisma.academicTerm.create({
      data: {
        name: dto.name,
        term_number: dto.term_number,
      },
    });

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
      message: 'تم إنشاء الفصل الدراسي في الكتالوج بنجاح.',
      data: this.serializeTerm(created),
    };
  }

  async update(id: number, dto: UpdateAcademicTermDto, adminId?: number, ipAddress?: string, userAgent?: string) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id: BigInt(id) },
    });

    if (!term || term.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'الفصل الدراسي غير موجود.',
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
          message: 'اسم الفصل الدراسي موجود مسبقاً.',
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
          message: 'رقم الفصل الدراسي موجود مسبقاً.',
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
      message: 'تم تحديث بيانات الفصل الدراسي بنجاح.',
      data: this.serializeTerm(updated),
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
        message: 'الفصل الدراسي غير موجود.',
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
        message: 'لا يمكن حذف الفصل الدراسي لوجود فصول صفية أو واجبات أو امتحانات مرتبطة به.',
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
      message: 'تم حذف الفصل الدراسي من الكتالوج بنجاح.',
    };
  }
}
