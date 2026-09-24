import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { CreateClassSubjectDto } from './dto/create-class-subject.dto.js';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto.js';
import { QueryClassSubjectsDto } from './dto/query-class-subjects.dto.js';

@Injectable()
export class ClassSubjectsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private serializeClassSubject(item: any) {
    return {
      id: Number(item.id),
      class_id: Number(item.class_id),
      subject_id: Number(item.subject_id),
      subject_name: item.subject ? item.subject.name : undefined,
      class_academic_term_id: Number(item.class_academic_term_id),
      max_coursework_score: Number(item.max_coursework_score ?? 40.0).toFixed(2),
      max_exam_score: Number(item.max_exam_score ?? 60.0).toFixed(2),
      exam_passing_score: Number(item.exam_passing_score ?? 30.0).toFixed(2),
      passing_score: Number(item.passing_score).toFixed(2),
      max_score: Number(item.max_score).toFixed(2),
      created_at: item.created_at ? item.created_at.toISOString() : null,
      updated_at: item.updated_at ? item.updated_at.toISOString() : null,
      deleted_at: item.deleted_at ? item.deleted_at.toISOString() : null,
    };
  }

  async findAll(query: QueryClassSubjectsDto = {}) {
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

    const termWhere: any = {
      deleted_at: null,
    };

    if (query.academic_term_id) {
      termWhere.academic_term_id = BigInt(query.academic_term_id);
    }

    const subjectWhere: any = {
      deleted_at: null,
    };

    if (query.subject_id) {
      subjectWhere.subject_id = BigInt(query.subject_id);
    }

    const [totalClasses, classes] = await Promise.all([
      this.prisma.class.count({
        where: {
          ...classWhere,
          class_academic_terms: {
            some: {
              ...termWhere,
              class_subjects: {
                some: subjectWhere,
              },
            },
          },
        },
      }),
      this.prisma.class.findMany({
        where: {
          ...classWhere,
          class_academic_terms: {
            some: {
              ...termWhere,
              class_subjects: {
                some: subjectWhere,
              },
            },
          },
        },
        include: {
          class_academic_terms: {
            where: termWhere,
            include: {
              academic_term: true,
              class_subjects: {
                where: subjectWhere,
                include: {
                  subject: true,
                },
                orderBy: {
                  subject_id: 'asc',
                },
              },
            },
            orderBy: {
              academic_term_id: 'asc',
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
      terms: c.class_academic_terms.map((t) => ({
        class_academic_term_id: Number(t.id),
        term_name: t.academic_term?.name,
        is_active: Number(t.is_active),
        is_closed: Number(t.is_closed),
        subjects: t.class_subjects.map((cs) => ({
          id: Number(cs.id),
          subject_id: Number(cs.subject_id),
          name: cs.subject?.name,
          code: cs.subject?.code,
          max_coursework_score: Number(cs.max_coursework_score ?? 40.0).toFixed(2),
          max_exam_score: Number(cs.max_exam_score ?? 60.0).toFixed(2),
          exam_passing_score: Number(cs.exam_passing_score ?? 30.0).toFixed(2),
          passing_score: Number(cs.passing_score).toFixed(2),
          max_score: Number(cs.max_score).toFixed(2),
        })),
      })),
    }));

    const message =
      formattedClasses.length === 0
        ? 'لا توجد مواد مقررة تطابق محددات البحث.'
        : 'تم جلب مناهج ومقررات الصفوف الدراسية بنجاح.';

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
    const record = await this.prisma.classSubject.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class: true,
        subject: true,
        class_academic_term: {
          include: {
            academic_term: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('مقرر المادة بالفترة غير موجود.');
    }

    return {
      success: true,
      message: 'تم جلب تفاصيل مقرر المادة بنجاح.',
      data: this.serializeClassSubject(record),
    };
  }

  async create(
    dto: CreateClassSubjectDto,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Score invariants check
    const errors: Record<string, string[]> = {};

    if (dto.passing_score > dto.max_score) {
      errors.passing_score = ['درجة النجاح الإجمالية يجب ألا تتجاوز الدرجة الكلية العظمى.'];
    }

    if (dto.exam_passing_score > dto.max_exam_score) {
      errors.exam_passing_score = ['درجة نجاح الامتحان النهائي يجب ألا تتجاوز الدرجة العظمى للامتحان.'];
    }

    const calculatedTotal = Number(dto.max_coursework_score) + Number(dto.max_exam_score);
    if (Math.abs(calculatedTotal - Number(dto.max_score)) > 0.001) {
      errors.max_score = ['الدرجة الكلية العظمى يجب أن تساوي مجموع عظمى أعمال السنة وعظمى الامتحان.'];
    }

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات إسناد المادة غير صالحة.',
        errors,
      });
    }

    // 2. Verify class_academic_term exists
    const classAcademicTerm = await this.prisma.classAcademicTerm.findFirst({
      where: {
        id: BigInt(dto.class_academic_term_id),
        deleted_at: null,
      },
    });

    if (!classAcademicTerm) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات إسناد المادة غير صالحة.',
        errors: {
          class_academic_term_id: ['تخصيص فترة الصف غير موجود.'],
        },
      });
    }

    // 3. Verify subject exists
    const subjectRecord = await this.prisma.subject.findFirst({
      where: {
        id: BigInt(dto.subject_id),
        deleted_at: null,
      },
    });

    if (!subjectRecord) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات إسناد المادة غير صالحة.',
        errors: {
          subject_id: ['المادة المحددة غير موجودة.'],
        },
      });
    }

    // 4. Check uniqueness (uq_class_term_subject)
    const existing = await this.prisma.classSubject.findFirst({
      where: {
        class_academic_term_id: BigInt(dto.class_academic_term_id),
        subject_id: BigInt(dto.subject_id),
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'المادة مقررة ومسندة مسبقاً لهذه الفترة بالصف الدراسي (uq_class_term_subject).',
      );
    }

    // 5. Create record
    const created = await this.prisma.classSubject.create({
      data: {
        class_id: classAcademicTerm.class_id,
        subject_id: BigInt(dto.subject_id),
        class_academic_term_id: BigInt(dto.class_academic_term_id),
        max_coursework_score: dto.max_coursework_score,
        max_exam_score: dto.max_exam_score,
        exam_passing_score: dto.exam_passing_score,
        passing_score: dto.passing_score,
        max_score: dto.max_score,
      },
      include: {
        subject: true,
      },
    });

    const serialized = this.serializeClassSubject(created);

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'create',
      entityType: 'class_subjects',
      entityId: BigInt(serialized.id),
      newValues: serialized,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم إسناد المادة وتحديد درجات الفترة بنجاح.',
      data: {
        id: serialized.id,
        class_id: serialized.class_id,
        subject_id: serialized.subject_id,
        subject_name: serialized.subject_name,
        class_academic_term_id: serialized.class_academic_term_id,
        max_coursework_score: serialized.max_coursework_score,
        max_exam_score: serialized.max_exam_score,
        exam_passing_score: serialized.exam_passing_score,
        passing_score: serialized.passing_score,
        max_score: serialized.max_score,
      },
    };
  }

  async update(
    id: number,
    dto: UpdateClassSubjectDto,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.classSubject.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        class_academic_term: true,
        subject: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('مقرر المادة بالفترة غير موجود.');
    }

    // Check lock on class_academic_term
    if (existing.class_academic_term?.is_closed === 1) {
      throw new ConflictException(
        'لا يمكن تعديل درجات المادة لأن درجات الفترة مغلقة نهائياً للأرشفة (is_closed = 1).',
      );
    }

    const maxCw =
      dto.max_coursework_score !== undefined
        ? Number(dto.max_coursework_score)
        : Number(existing.max_coursework_score ?? 40.0);
    const maxEx =
      dto.max_exam_score !== undefined
        ? Number(dto.max_exam_score)
        : Number(existing.max_exam_score ?? 60.0);
    const exPass =
      dto.exam_passing_score !== undefined
        ? Number(dto.exam_passing_score)
        : Number(existing.exam_passing_score ?? 30.0);
    const passScore =
      dto.passing_score !== undefined ? Number(dto.passing_score) : Number(existing.passing_score);
    const maxScore =
      dto.max_score !== undefined ? Number(dto.max_score) : Number(existing.max_score);

    const errors: Record<string, string[]> = {};

    if (passScore > maxScore) {
      errors.passing_score = ['درجة النجاح الإجمالية يجب ألا تتجاوز الدرجة الكلية العظمى.'];
    }

    if (exPass > maxEx) {
      errors.exam_passing_score = ['درجة نجاح الامتحان النهائي يجب ألا تتجاوز الدرجة العظمى للامتحان.'];
    }

    const calculatedTotal = maxCw + maxEx;
    if (Math.abs(calculatedTotal - maxScore) > 0.001) {
      errors.max_score = ['الدرجة الكلية العظمى يجب أن تساوي مجموع عظمى أعمال السنة وعظمى الامتحان.'];
    }

    if (Object.keys(errors).length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات التحديث غير صالحة.',
        errors,
      });
    }

    const termId = dto.class_academic_term_id
      ? BigInt(dto.class_academic_term_id)
      : existing.class_academic_term_id;
    const subId = dto.subject_id ? BigInt(dto.subject_id) : existing.subject_id;

    // Check uniqueness if changed
    if (termId !== existing.class_academic_term_id || subId !== existing.subject_id) {
      const conflict = await this.prisma.classSubject.findFirst({
        where: {
          class_academic_term_id: termId,
          subject_id: subId,
          deleted_at: null,
          NOT: { id: BigInt(id) },
        },
      });

      if (conflict) {
        throw new ConflictException(
          'المادة مقررة ومسندة مسبقاً لهذه الفترة بالصف الدراسي (uq_class_term_subject).',
        );
      }
    }

    const updated = await this.prisma.classSubject.update({
      where: { id: BigInt(id) },
      data: {
        class_academic_term_id: termId,
        subject_id: subId,
        max_coursework_score: maxCw,
        max_exam_score: maxEx,
        exam_passing_score: exPass,
        passing_score: passScore,
        max_score: maxScore,
      },
      include: {
        subject: true,
      },
    });

    const serialized = this.serializeClassSubject(updated);

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'update',
      entityType: 'class_subjects',
      entityId: BigInt(id),
      oldValues: this.serializeClassSubject(existing),
      newValues: serialized,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث درجات المادة بالفترة بنجاح.',
      data: {
        id: serialized.id,
        class_id: serialized.class_id,
        subject_id: serialized.subject_id,
        subject_name: serialized.subject_name,
        class_academic_term_id: serialized.class_academic_term_id,
        max_coursework_score: serialized.max_coursework_score,
        max_exam_score: serialized.max_exam_score,
        exam_passing_score: serialized.exam_passing_score,
        passing_score: serialized.passing_score,
        max_score: serialized.max_score,
      },
    };
  }

  async remove(
    id: number,
    adminId?: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.classSubject.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
      include: {
        subject: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('مقرر المادة المراد حذفه غير موجود.');
    }

    // Check RESTRICT: teaching assignments for this class and subject
    const teachingCount = await this.prisma.teachingAssignment.count({
      where: {
        subject_id: existing.subject_id,
        class_section: {
          class_id: existing.class_id,
        },
        deleted_at: null,
      },
    });

    if (teachingCount > 0) {
      throw new ConflictException(
        'لا يمكن إزالة المادة لوجود درجات امتحانات رسمية أو جدول حصص مسجل لها في هذه الفترة (RESTRICT).',
      );
    }

    const deleted = await this.prisma.classSubject.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: new Date(),
      },
    });

    const serialized = this.serializeClassSubject(existing);

    await this.auditService.log({
      userId: adminId ? BigInt(adminId) : null,
      action: 'delete',
      entityType: 'class_subjects',
      entityId: BigInt(id),
      oldValues: serialized,
      newValues: null,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return {
      success: true,
      message: 'تمت إزالة المادة من منهج الفترة بنجاح.',
    };
  }
}
