import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreatePeriodSlotDto } from './dto/create-period-slot.dto.js';
import { UpdatePeriodSlotDto } from './dto/update-period-slot.dto.js';
import { QueryPeriodSlotDto } from './dto/query-period-slot.dto.js';

@Injectable()
export class PeriodSlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper: Normalize time string to HH:mm:ss format
   */
  private normalizeTime(timeStr: string): string {
    const trimmed = timeStr.trim();
    const parts = trimmed.split(':');
    const h = parts[0].padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    const s = (parts[2] || '00').padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  /**
   * Helper: Convert normalized time string to Date for Prisma @db.Time(0)
   */
  private timeToDate(timeStr: string): Date {
    const normalized = this.normalizeTime(timeStr);
    return new Date(`1970-01-01T${normalized}Z`);
  }

  /**
   * Helper: Format Date/String from DB to HH:mm:ss string
   */
  private formatTime(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') {
      return this.normalizeTime(val);
    }
    if (val instanceof Date) {
      return val.toISOString().substring(11, 19);
    }
    return String(val);
  }

  /**
   * Helper: Transform database model to response contract
   */
  private serializeSlot(slot: any) {
    return {
      id: Number(slot.id),
      name: slot.name,
      slot_number: slot.slot_number,
      start_time: this.formatTime(slot.start_time),
      end_time: this.formatTime(slot.end_time),
      is_break: Number(slot.is_break),
      created_at: slot.created_at,
    };
  }

  /**
   * 1.1 GET /api/v1/period-slots
   * Retrieve, search and paginate daily period slots
   */
  async findAll(query: QueryPeriodSlotDto) {
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

    if (query.is_break !== undefined && query.is_break !== null) {
      where.is_break = Number(query.is_break);
    }

    const sortField = query.sort_by || 'slot_number';
    const sortDirection = query.sort_order || 'asc';
    const orderBy: any = {};
    orderBy[sortField] = sortDirection;

    const [total, slots] = await Promise.all([
      this.prisma.periodSlot.count({ where }),
      this.prisma.periodSlot.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
    ]);

    const data = slots.map((s) => this.serializeSlot(s));
    const lastPage = Math.max(1, Math.ceil(total / perPage));

    return {
      success: true,
      message:
        data.length > 0
          ? 'تم جلب فترات الحصص اليومية بنجاح.'
          : 'لا توجد فترات حصص تطابق محددات البحث.',
      data,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: lastPage,
      },
    };
  }

  /**
   * 1.2 POST /api/v1/period-slots
   * Create a new period slot or break period
   */
  async create(dto: CreatePeriodSlotDto, adminUserId: number, ipAddress?: string, userAgent?: string) {
    const normalizedStart = this.normalizeTime(dto.start_time);
    const normalizedEnd = this.normalizeTime(dto.end_time);

    // 1. Invariant: start_time < end_time
    if (normalizedStart >= normalizedEnd) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات فترة الحصة غير صالحة.',
        errors: {
          end_time: ['وقت النهاية يجب أن يكون لاحقاً لوقت البداية.'],
        },
      });
    }

    // 2. Invariant: uq_period_slots_number
    const duplicate = await this.prisma.periodSlot.findFirst({
      where: {
        slot_number: Number(dto.slot_number),
        deleted_at: null,
      },
    });

    if (duplicate) {
      throw new ConflictException({
        success: false,
        message: 'الرقم التسلسلي للحصة مسجل مسبقاً (uq_period_slots_number).',
      });
    }

    const isBreakValue = dto.is_break !== undefined ? Number(dto.is_break) : 0;

    const newSlot = await this.prisma.$transaction(async (tx) => {
      const created = await tx.periodSlot.create({
        data: {
          name: dto.name.trim(),
          slot_number: Number(dto.slot_number),
          start_time: this.timeToDate(normalizedStart),
          end_time: this.timeToDate(normalizedEnd),
          is_break: isBreakValue,
        },
      });

      await this.auditService.log({
        userId: BigInt(adminUserId),
        action: 'create',
        entityType: 'period_slots',
        entityId: created.id,
        newValues: {
          name: created.name,
          slot_number: created.slot_number,
          start_time: normalizedStart,
          end_time: normalizedEnd,
          is_break: created.is_break,
        },
        ipAddress,
        userAgent,
      });

      return created;
    });

    return {
      success: true,
      message: 'تم إنشاء فترة الحصة اليومية بنجاح.',
      data: this.serializeSlot(newSlot),
    };
  }

  /**
   * 1.2 PUT /api/v1/period-slots/:id
   * Update an existing period slot
   */
  async update(
    id: number,
    dto: UpdatePeriodSlotDto,
    adminUserId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.periodSlot.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'فترة الحصة غير موجودة.',
      });
    }

    const currentStart = this.formatTime(existing.start_time);
    const currentEnd = this.formatTime(existing.end_time);
    const targetStart = dto.start_time ? this.normalizeTime(dto.start_time) : currentStart;
    const targetEnd = dto.end_time ? this.normalizeTime(dto.end_time) : currentEnd;

    // 1. Invariant: start_time < end_time
    if (targetStart >= targetEnd) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'بيانات فترة الحصة غير صالحة.',
        errors: {
          end_time: ['وقت النهاية يجب أن يكون لاحقاً لوقت البداية.'],
        },
      });
    }

    // 2. Invariant: uq_period_slots_number if changed
    if (dto.slot_number !== undefined && Number(dto.slot_number) !== existing.slot_number) {
      const duplicate = await this.prisma.periodSlot.findFirst({
        where: {
          slot_number: Number(dto.slot_number),
          deleted_at: null,
          id: { not: BigInt(id) },
        },
      });

      if (duplicate) {
        throw new ConflictException({
          success: false,
          message: 'الرقم التسلسلي للحصة مسجل مسبقاً (uq_period_slots_number).',
        });
      }
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.slot_number !== undefined) updateData.slot_number = Number(dto.slot_number);
    if (dto.start_time !== undefined) updateData.start_time = this.timeToDate(targetStart);
    if (dto.end_time !== undefined) updateData.end_time = this.timeToDate(targetEnd);
    if (dto.is_break !== undefined) updateData.is_break = Number(dto.is_break);

    const updatedSlot = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.periodSlot.update({
        where: { id: BigInt(id) },
        data: updateData,
      });

      await this.auditService.log({
        userId: BigInt(adminUserId),
        action: 'update',
        entityType: 'period_slots',
        entityId: updated.id,
        oldValues: {
          name: existing.name,
          slot_number: existing.slot_number,
          start_time: currentStart,
          end_time: currentEnd,
          is_break: existing.is_break,
        },
        newValues: {
          name: updated.name,
          slot_number: updated.slot_number,
          start_time: targetStart,
          end_time: targetEnd,
          is_break: updated.is_break,
        },
        ipAddress,
        userAgent,
      });

      return updated;
    });

    return {
      success: true,
      message: 'تم تحديث فترة الحصة اليومية بنجاح.',
      data: this.serializeSlot(updatedSlot),
    };
  }

  /**
   * 1.3 DELETE /api/v1/period-slots/:id
   * Soft-delete period slot with RESTRICT check against timetable_slots
   */
  async remove(id: number, adminUserId: number, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.periodSlot.findFirst({
      where: {
        id: BigInt(id),
        deleted_at: null,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'فترة الحصة غير موجودة.',
      });
    }

    // 1. Relational Integrity: RESTRICT check against timetable_slots
    const linkedCount = await this.prisma.timetableSlot.count({
      where: {
        period_slot_id: BigInt(id),
        deleted_at: null,
      },
    });

    if (linkedCount > 0) {
      throw new ConflictException({
        success: false,
        message:
          'لا يمكن حذف فترة الحصة لارتباطها بحصص مجدولة في الجداول الأسبوعية (Foreign Key Restrict).',
      });
    }

    // 2. Soft-delete
    await this.prisma.$transaction(async (tx) => {
      await tx.periodSlot.update({
        where: { id: BigInt(id) },
        data: { deleted_at: new Date() },
      });

      await this.auditService.log({
        userId: BigInt(adminUserId),
        action: 'delete',
        entityType: 'period_slots',
        entityId: BigInt(id),
        oldValues: {
          name: existing.name,
          slot_number: existing.slot_number,
          start_time: this.formatTime(existing.start_time),
          end_time: this.formatTime(existing.end_time),
          is_break: existing.is_break,
        },
        ipAddress,
        userAgent,
      });
    });

    return {
      success: true,
      message: 'تم حذف فترة الحصة بنجاح.',
    };
  }
}
