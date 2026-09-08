import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateGuardianDto } from './dto/create-guardian.dto.js';
import { UpdateGuardianDto } from './dto/update-guardian.dto.js';
import { FindGuardiansQueryDto } from './dto/find-guardians-query.dto.js';
import { RoleType, GuardianRelationship } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GuardiansService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: FindGuardiansQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const perPage = Math.max(1, Number(query.per_page) || 15);
    const skip = (page - 1) * perPage;

    const where: any = {
      deleted_at: null,
    };

    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search } },
        { phone: { contains: query.search } },
        { user: { user_code: { contains: query.search } } },
      ];
    }

    const orderBy: any = {};
    const sortOrder = query.sort_order || 'desc';
    if (query.sort_by === 'full_name') {
      orderBy.full_name = sortOrder;
    } else {
      orderBy.id = sortOrder;
    }

    const [total, guardians] = await Promise.all([
      this.prisma.guardian.count({ where }),
      this.prisma.guardian.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              user_code: true,
              is_active: true,
            },
          },
          students: {
            where: { deleted_at: null },
          },
        },
      }),
    ]);

    const data = guardians.map((g) => ({
      id: Number(g.id),
      user_id: Number(g.user_id),
      user_code: g.user.user_code,
      full_name: g.full_name,
      phone: g.phone,
      relationship: g.relationship,
      students_count: g.students.length,
      created_at: g.created_at.toISOString(),
    }));

    return {
      success: true,
      message: total > 0 ? 'تم جلب قائمة أولياء الأمور بنجاح.' : 'لا توجد سجلات أولياء أمور تطابق محددات البحث.',
      data,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage) || 1,
      },
    };
  }

  async findOne(id: number, currentUser?: any) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            id: true,
            user_code: true,
            is_active: true,
          },
        },
        students: {
          where: { deleted_at: null },
        },
      },
    });

    if (!guardian || guardian.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف ولي الأمر غير موجود.',
      });
    }

    // Role-based scoping: Parent can only view own profile
    if (
      currentUser &&
      currentUser.role_type === RoleType.parent &&
      Number(currentUser.id) !== Number(guardian.user_id)
    ) {
      throw new ForbiddenException({
        success: false,
        message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      });
    }

    return {
      success: true,
      message: 'تم جلب تفاصيل ملف ولي الأمر بنجاح.',
      data: {
        id: Number(guardian.id),
        user_id: Number(guardian.user_id),
        user_code: guardian.user.user_code,
        full_name: guardian.full_name,
        phone: guardian.phone,
        relationship: guardian.relationship,
        students_count: guardian.students.length,
        created_at: guardian.created_at.toISOString(),
      },
    };
  }

  async create(
    dto: CreateGuardianDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Unique phone check (uq_guardians_phone)
    const existingPhone = await this.prisma.guardian.findFirst({
      where: {
        phone: dto.phone,
        deleted_at: null,
      },
    });

    if (existingPhone) {
      throw new ConflictException({
        success: false,
        message: 'رقم هاتف ولي الأمر مسجل مسبقاً في المنظومة (uq_guardians_phone).',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const { newGuardian, newUser } = await this.prisma.$transaction(async (tx) => {
      // Sequence generation for PAR-XXXX
      const latestUsers = await tx.user.findMany({
        where: {
          user_code: { startsWith: 'PAR-' },
        },
        select: { user_code: true },
      });

      let nextNumber = 4001;
      for (const u of latestUsers) {
        const num = parseInt(u.user_code.replace('PAR-', ''), 10);
        if (!isNaN(num) && num >= nextNumber) {
          nextNumber = num + 1;
        }
      }

      const userCode = `PAR-${nextNumber}`;

      const user = await tx.user.create({
        data: {
          user_code: userCode,
          password: hashedPassword,
          role_type: RoleType.parent,
          is_active: 1,
        },
      });

      const guardian = await tx.guardian.create({
        data: {
          user_id: user.id,
          full_name: dto.full_name,
          phone: dto.phone,
          relationship: dto.relationship || GuardianRelationship.father,
        },
      });

      return { newGuardian: guardian, newUser: user };
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'guardian_created',
      entityType: 'Guardian',
      entityId: newGuardian.id,
      newValues: {
        id: Number(newGuardian.id),
        user_id: Number(newUser.id),
        user_code: newUser.user_code,
        full_name: newGuardian.full_name,
        phone: newGuardian.phone,
        relationship: newGuardian.relationship,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم إنشاء ملف ولي الأمر وتوليد حساب الدخول بنجاح.',
      data: {
        id: Number(newGuardian.id),
        user_id: Number(newUser.id),
        user_code: newUser.user_code,
        full_name: newGuardian.full_name,
        phone: newGuardian.phone,
        relationship: newGuardian.relationship,
        created_at: newGuardian.created_at.toISOString(),
      },
    };
  }

  async update(
    id: number,
    dto: UpdateGuardianDto,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: BigInt(id) },
      include: { user: true },
    });

    if (!guardian || guardian.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف ولي الأمر غير موجود.',
      });
    }

    // If phone is updated, check uniqueness
    if (dto.phone && dto.phone !== guardian.phone) {
      const existing = await this.prisma.guardian.findFirst({
        where: {
          phone: dto.phone,
          deleted_at: null,
          NOT: { id: guardian.id },
        },
      });
      if (existing) {
        throw new ConflictException({
          success: false,
          message: 'رقم هاتف ولي الأمر مسجل مسبقاً في المنظومة (uq_guardians_phone).',
        });
      }
    }

    const oldValues = {
      full_name: guardian.full_name,
      phone: guardian.phone,
      relationship: guardian.relationship,
    };

    let hashedPassword: string | undefined = undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (hashedPassword) {
        await tx.user.update({
          where: { id: guardian.user_id },
          data: { password: hashedPassword },
        });
      }

      return tx.guardian.update({
        where: { id: BigInt(id) },
        data: {
          full_name: dto.full_name ?? undefined,
          phone: dto.phone ?? undefined,
          relationship: dto.relationship ?? undefined,
        },
        include: { user: true },
      });
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'guardian_updated',
      entityType: 'Guardian',
      entityId: guardian.id,
      oldValues,
      newValues: {
        full_name: updated.full_name,
        phone: updated.phone,
        relationship: updated.relationship,
        password_changed: !!hashedPassword,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث ملف ولي الأمر بنجاح.',
      data: {
        id: Number(updated.id),
        user_id: Number(updated.user_id),
        user_code: updated.user.user_code,
        full_name: updated.full_name,
        phone: updated.phone,
        relationship: updated.relationship,
      },
    };
  }

  async delete(
    id: number,
    adminId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: BigInt(id) },
    });

    if (!guardian || guardian.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف ولي الأمر غير موجود.',
      });
    }

    // Strict RESTRICT Protection: Check active custody links
    const activeCustody = await this.prisma.guardianStudent.count({
      where: {
        guardian_id: guardian.id,
        deleted_at: null,
      },
    });

    if (activeCustody > 0) {
      throw new ConflictException({
        success: false,
        message:
          'لا يمكن حذف ولي الأمر لارتباطه بروابط وصاية مع طلاب في المنظومة (Foreign Key Restrict).',
      });
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.guardian.update({
        where: { id: guardian.id },
        data: { deleted_at: now },
      });

      await tx.user.update({
        where: { id: guardian.user_id },
        data: { deleted_at: now, is_active: 0 },
      });

      await tx.personalAccessToken.deleteMany({
        where: { user_id: guardian.user_id },
      });
    });

    await this.auditService.log({
      userId: BigInt(adminId),
      action: 'guardian_deleted',
      entityType: 'Guardian',
      entityId: guardian.id,
      oldValues: {
        id: Number(guardian.id),
        user_id: Number(guardian.user_id),
        full_name: guardian.full_name,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم حذف ملف ولي الأمر وحسابه بنجاح.',
    };
  }

  async getStudents(guardianId: number, currentUser?: any) {
    // Security / RBAC: Parent can only view own children
    if (currentUser && currentUser.role_type === RoleType.parent) {
      const myGuardian = await this.prisma.guardian.findFirst({
        where: { user_id: BigInt(currentUser.id), deleted_at: null },
      });
      if (!myGuardian || Number(myGuardian.id) !== Number(guardianId)) {
        throw new ForbiddenException({
          success: false,
          message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
        });
      }
    }

    const guardian = await this.prisma.guardian.findUnique({
      where: { id: BigInt(guardianId) },
    });

    if (!guardian || guardian.deleted_at !== null) {
      throw new NotFoundException({
        success: false,
        message: 'ملف ولي الأمر غير موجود.',
      });
    }

    const custodies = await this.prisma.guardianStudent.findMany({
      where: {
        guardian_id: BigInt(guardianId),
        deleted_at: null,
      },
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              where: { deleted_at: null },
              orderBy: { id: 'desc' },
              take: 1,
              include: {
                class: true,
                class_section: {
                  include: {
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const data = custodies
      .filter((c) => c.student && c.student.deleted_at === null)
      .map((c) => {
        const s = c.student;
        let classSectionStr: string | null = null;
        if (s.enrollments && s.enrollments.length > 0) {
          const enr = s.enrollments[0];
          const className = enr.class?.name || '';
          const sectionName = enr.class_section?.section?.name || '';
          classSectionStr = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
        }

        return {
          id: Number(c.id),
          student_id: Number(s.id),
          student_code: s.user.user_code,
          student_name: s.full_name,
          class_section: classSectionStr,
          is_primary: c.is_primary,
        };
      });

    return {
      success: true,
      message: 'تم جلب قائمة الأبناء المكفولين لولي الأمر بنجاح.',
      data,
    };
  }
}
