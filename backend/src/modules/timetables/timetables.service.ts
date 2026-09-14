import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto.js';
import { UpdateTimetableSlotDto } from './dto/update-timetable-slot.dto.js';
import { QueryTimetableDto } from './dto/query-timetable.dto.js';
import { DayOfWeek } from '@prisma/client';

export const DAY_ARABIC_MAP: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  saturday: 'السبت',
};

const STANDARD_DAYS_ORDER = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'saturday',
];

@Injectable()
export class TimetablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to resolve active or requested academic year
   */
  private async resolveAcademicYear(yearId?: number) {
    if (yearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: BigInt(yearId) },
      });
      if (year) return year;
    }

    const activeYear = await this.prisma.academicYear.findFirst({
      where: { is_active: 1, deleted_at: null },
      orderBy: { id: 'desc' },
    });

    if (activeYear) return activeYear;

    const anyYear = await this.prisma.academicYear.findFirst({
      orderBy: { id: 'desc' },
    });

    return anyYear;
  }

  /**
   * 1.1 GET /api/v1/timetable-slots
   * Retrieve lightweight classes & sections structure
   */
  async findStructure(query: QueryTimetableDto) {
    const year = await this.resolveAcademicYear(query.academic_year_id);
    if (!year) {
      return {
        success: true,
        message: 'لا توجد صفوف أو شُعب مسجلة بالعام الدراسي المحدد.',
        data: {
          academic_year_id: null,
          academic_year_name: '',
          classes: [],
        },
      };
    }

    const classWhere: any = { deleted_at: null };
    if (query.class_id) {
      classWhere.id = BigInt(query.class_id);
    }

    const classes = await this.prisma.class.findMany({
      where: classWhere,
      include: {
        class_sections: {
          where: { deleted_at: null },
          include: {
            section: true,
          },
        },
      },
      orderBy: [{ grade_level: 'asc' }, { id: 'asc' }],
    });

    const formattedClasses = classes.map((c) => ({
      class_id: Number(c.id),
      class_name: c.name,
      grade_level: c.grade_level,
      sections: c.class_sections.map((cs) => ({
        class_section_id: Number(cs.id),
        section_name: cs.section?.name || '',
      })),
    }));

    return {
      success: true,
      message: 'تم جلب هيكل الصفوف والشعب للجدول الأسبوعي بنجاح.',
      data: {
        academic_year_id: Number(year.id),
        academic_year_name: year.name,
        classes: formattedClasses,
      },
    };
  }

  /**
   * 1.2 GET /api/v1/timetable-slots/completion-status
   * Audit timetable completion and unscheduled slots
   */
  async getCompletionStatus(query: QueryTimetableDto) {
    const year = await this.resolveAcademicYear(query.academic_year_id);
    if (!year) {
      return {
        success: true,
        message: 'لا توجد بيانات للعام الدراسي المحدد.',
        data: {
          academic_year_id: null,
          academic_year_name: '',
          total_unscheduled_school_slots: 0,
          classes: [],
        },
      };
    }

    const activePeriodSlotsCount = await this.prisma.periodSlot.count({
      where: { is_break: 0, deleted_at: null },
    });
    // Standard teaching days count = 5 (Sunday to Thursday)
    const teachingDaysCount = 5;
    const standardTotalSlots =
      activePeriodSlotsCount > 0 ? activePeriodSlotsCount * teachingDaysCount : 30;

    const classWhere: any = { deleted_at: null };
    if (query.class_id) {
      classWhere.id = BigInt(query.class_id);
    }

    const classes = await this.prisma.class.findMany({
      where: classWhere,
      include: {
        class_sections: {
          where: { deleted_at: null },
          include: {
            section: true,
          },
        },
      },
      orderBy: [{ grade_level: 'asc' }, { id: 'asc' }],
    });

    let schoolTotalUnscheduled = 0;

    const classesData = await Promise.all(
      classes.map(async (cls) => {
        let classUnscheduledTotal = 0;

        const sectionsData = await Promise.all(
          cls.class_sections.map(async (cs) => {
            const scheduledSlotsCount = await this.prisma.timetableSlot.count({
              where: {
                academic_year_id: year.id,
                class_section_id: cs.id,
                deleted_at: null,
              },
            });

            const unscheduledSlotsCount = Math.max(
              0,
              standardTotalSlots - scheduledSlotsCount,
            );
            const isFullyScheduled = scheduledSlotsCount >= standardTotalSlots;

            classUnscheduledTotal += unscheduledSlotsCount;

            return {
              class_section_id: Number(cs.id),
              section_name: cs.section?.name || '',
              total_slots: standardTotalSlots,
              scheduled_slots_count: scheduledSlotsCount,
              unscheduled_slots_count: unscheduledSlotsCount,
              is_fully_scheduled: isFullyScheduled,
            };
          }),
        );

        schoolTotalUnscheduled += classUnscheduledTotal;

        return {
          class_id: Number(cls.id),
          class_name: cls.name,
          grade_level: cls.grade_level,
          total_unscheduled_slots: classUnscheduledTotal,
          is_fully_scheduled: classUnscheduledTotal === 0,
          sections: sectionsData,
        };
      }),
    );

    return {
      success: true,
      message: 'تم جلب تقرير تدقيق واكتمال جداول الحصص بنجاح.',
      data: {
        academic_year_id: Number(year.id),
        academic_year_name: year.name,
        total_unscheduled_school_slots: schoolTotalUnscheduled,
        classes: classesData,
      },
    };
  }

  /**
   * 1.3 GET /api/v1/class-sections/:class_section_id/timetable
   * Lazy load weekly timetable matrix for a single class section
   */
  async getSectionTimetable(classSectionId: number) {
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: BigInt(classSectionId) },
      include: {
        class: true,
        section: true,
      },
    });

    if (!classSection || classSection.deleted_at) {
      throw new NotFoundException('الشعبة الدراسية غير موجودة.');
    }

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        class_section_id: BigInt(classSectionId),
        deleted_at: null,
      },
      include: {
        period_slot: true,
        teaching_assignment: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
      orderBy: [{ day_of_week: 'asc' }, { period_slot: { slot_number: 'asc' } }],
    });

    // Group by day of the week
    const slotsByDay = new Map<string, any[]>();
    for (const d of STANDARD_DAYS_ORDER) {
      slotsByDay.set(d, []);
    }

    for (const slot of slots) {
      const dayKey = slot.day_of_week;
      if (!slotsByDay.has(dayKey)) {
        slotsByDay.set(dayKey, []);
      }
      slotsByDay.get(dayKey)?.push({
        id: Number(slot.id),
        period_slot_id: Number(slot.period_slot_id),
        period_name: slot.period_slot?.name || '',
        slot_number: slot.period_slot?.slot_number || 0,
        subject_id: Number(slot.teaching_assignment?.subject_id || 0),
        subject_name: slot.teaching_assignment?.subject?.name || '',
        teacher_id: Number(slot.teaching_assignment?.teacher_id || 0),
        teacher_name: slot.teaching_assignment?.teacher?.full_name || '',
        teaching_assignment_id: Number(slot.teaching_assignment_id),
      });
    }

    const timetable = Array.from(slotsByDay.entries())
      .filter(([_, daySlots]) => daySlots.length > 0)
      .map(([dayKey, daySlots]) => ({
        day_of_week: dayKey,
        day_of_week_ar: DAY_ARABIC_MAP[dayKey] || dayKey,
        slots: daySlots.sort((a, b) => a.slot_number - b.slot_number),
      }));

    return {
      success: true,
      message: 'تم جلب جدول الحصص الأسبوعي للشعبة بنجاح.',
      data: {
        class_section_id: Number(classSection.id),
        class_name: classSection.class?.name || '',
        section_name: classSection.section?.name || '',
        timetable,
      },
    };
  }

  /**
   * 1.4 GET /api/v1/teachers/:teacher_id/timetable
   * Retrieve weekly timetable for a specific teacher
   */
  async getTeacherTimetable(teacherId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: BigInt(teacherId) },
    });

    if (!teacher || teacher.deleted_at) {
      throw new NotFoundException('المعلم غير موجود.');
    }

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        teaching_assignment: {
          teacher_id: BigInt(teacherId),
        },
        deleted_at: null,
      },
      include: {
        period_slot: true,
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
        teaching_assignment: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: [{ day_of_week: 'asc' }, { period_slot: { slot_number: 'asc' } }],
    });

    const slotsByDay = new Map<string, any[]>();
    for (const d of STANDARD_DAYS_ORDER) {
      slotsByDay.set(d, []);
    }

    for (const slot of slots) {
      const dayKey = slot.day_of_week;
      if (!slotsByDay.has(dayKey)) {
        slotsByDay.set(dayKey, []);
      }
      slotsByDay.get(dayKey)?.push({
        id: Number(slot.id),
        period_slot_id: Number(slot.period_slot_id),
        period_name: slot.period_slot?.name || '',
        slot_number: slot.period_slot?.slot_number || 0,
        class_name: slot.class_section?.class?.name || '',
        section_name: slot.class_section?.section?.name || '',
        subject_name: slot.teaching_assignment?.subject?.name || '',
      });
    }

    const timetable = Array.from(slotsByDay.entries())
      .filter(([_, daySlots]) => daySlots.length > 0)
      .map(([dayKey, daySlots]) => ({
        day_of_week: dayKey,
        day_of_week_ar: DAY_ARABIC_MAP[dayKey] || dayKey,
        slots: daySlots.sort((a, b) => a.slot_number - b.slot_number),
      }));

    return {
      success: true,
      message: 'تم جلب جدول الحصص الأسبوعي للمعلم بنجاح.',
      data: {
        teacher_id: Number(teacher.id),
        teacher_name: teacher.full_name,
        timetable,
      },
    };
  }

  /**
   * 1.5 POST /api/v1/timetable-slots
   * Create a new timetable slot with anti-collision checks
   */
  async create(
    dto: CreateTimetableSlotDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Validate period slot
    const period = await this.prisma.periodSlot.findUnique({
      where: { id: BigInt(dto.period_slot_id) },
    });
    if (!period || period.deleted_at) {
      throw new BadRequestException('توقيت الحصة المختار غير موجود.');
    }
    if (period.is_break === 1) {
      throw new BadRequestException('لا يمكن تسكين حصة في فترة راحة أو فسحة.');
    }

    // 2. Validate teaching assignment
    const assignment = await this.prisma.teachingAssignment.findUnique({
      where: { id: BigInt(dto.teaching_assignment_id) },
      include: {
        teacher: true,
        subject: true,
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });
    if (!assignment || assignment.deleted_at) {
      throw new BadRequestException('إسناد التدريس المختار غير صالح.');
    }

    // 3. Section collision check (uq_timetable_section_slot)
    const existingSectionSlot = await this.prisma.timetableSlot.findFirst({
      where: {
        academic_year_id: BigInt(dto.academic_year_id),
        class_section_id: BigInt(dto.class_section_id),
        day_of_week: dto.day_of_week,
        period_slot_id: BigInt(dto.period_slot_id),
      },
    });
    if (existingSectionSlot && !existingSectionSlot.deleted_at) {
      throw new ConflictException(
        'تعارض في الجدول: الشعبة مرتبطة بحصة أخرى في نفس اليوم والتوقيت (uq_timetable_section_slot).',
      );
    }

    // 4. Teacher anti-collision check
    const existingTeacherSlot = await this.prisma.timetableSlot.findFirst({
      where: {
        academic_year_id: BigInt(dto.academic_year_id),
        day_of_week: dto.day_of_week,
        period_slot_id: BigInt(dto.period_slot_id),
        deleted_at: null,
        teaching_assignment: {
          teacher_id: assignment.teacher_id,
        },
      },
    });
    if (existingTeacherSlot) {
      throw new ConflictException(
        'تعارض في الجدول: المعلم مرتبط بحصة أخرى مع شعبة أخرى في نفس اليوم والتوقيت.',
      );
    }

    // 5. Create or restore slot
    const includeQuery = {
      academic_year: true,
      period_slot: true,
      class_section: {
        include: {
          class: true,
          section: true,
        },
      },
      teaching_assignment: {
        include: {
          subject: true,
          teacher: true,
        },
      },
    };

    const newSlot = existingSectionSlot
      ? await this.prisma.timetableSlot.update({
          where: { id: existingSectionSlot.id },
          data: {
            teaching_assignment_id: BigInt(dto.teaching_assignment_id),
            deleted_at: null,
          },
          include: includeQuery,
        })
      : await this.prisma.timetableSlot.create({
          data: {
            academic_year_id: BigInt(dto.academic_year_id),
            class_section_id: BigInt(dto.class_section_id),
            day_of_week: dto.day_of_week,
            period_slot_id: BigInt(dto.period_slot_id),
            teaching_assignment_id: BigInt(dto.teaching_assignment_id),
          },
          include: includeQuery,
        });

    // 6. Audit log
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'create',
      entityType: 'timetable_slots',
      entityId: BigInt(newSlot.id),
      newValues: {
        academic_year_id: dto.academic_year_id,
        class_section_id: dto.class_section_id,
        day_of_week: dto.day_of_week,
        period_slot_id: dto.period_slot_id,
        teaching_assignment_id: dto.teaching_assignment_id,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم إضافة وتسكين الحصة بالجدول الأسبوعي بنجاح.',
      data: {
        id: Number(newSlot.id),
        academic_year_id: Number(newSlot.academic_year_id),
        academic_year_name: newSlot.academic_year?.name || '',
        class_id: Number(newSlot.class_section?.class_id || 0),
        class_name: newSlot.class_section?.class?.name || '',
        class_section_id: Number(newSlot.class_section_id),
        section_name: newSlot.class_section?.section?.name || '',
        subject_id: Number(newSlot.teaching_assignment?.subject_id || 0),
        subject_name: newSlot.teaching_assignment?.subject?.name || '',
        teacher_id: Number(newSlot.teaching_assignment?.teacher_id || 0),
        teacher_name: newSlot.teaching_assignment?.teacher?.full_name || '',
        day_of_week: newSlot.day_of_week,
        day_of_week_ar: DAY_ARABIC_MAP[newSlot.day_of_week] || newSlot.day_of_week,
        period_slot_id: Number(newSlot.period_slot_id),
        period_name: newSlot.period_slot?.name || '',
        created_at: newSlot.created_at.toISOString(),
      },
    };
  }

  /**
   * 1.5 PUT /api/v1/timetable-slots/:id
   * Update an existing timetable slot
   */
  async update(
    id: number,
    dto: UpdateTimetableSlotDto,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existingSlot = await this.prisma.timetableSlot.findUnique({
      where: { id: BigInt(id) },
      include: {
        teaching_assignment: true,
      },
    });

    if (!existingSlot || existingSlot.deleted_at) {
      throw new NotFoundException('سجل الحصة بالجدول غير موجود.');
    }

    const academicYearId = dto.academic_year_id
      ? BigInt(dto.academic_year_id)
      : existingSlot.academic_year_id;
    const classSectionId = dto.class_section_id
      ? BigInt(dto.class_section_id)
      : existingSlot.class_section_id;
    const dayOfWeek = dto.day_of_week || existingSlot.day_of_week;
    const periodSlotId = dto.period_slot_id
      ? BigInt(dto.period_slot_id)
      : existingSlot.period_slot_id;
    const teachingAssignmentId = dto.teaching_assignment_id
      ? BigInt(dto.teaching_assignment_id)
      : existingSlot.teaching_assignment_id;

    // Validate period if changing
    if (dto.period_slot_id) {
      const period = await this.prisma.periodSlot.findUnique({
        where: { id: BigInt(dto.period_slot_id) },
      });
      if (!period || period.deleted_at) {
        throw new BadRequestException('توقيت الحصة المختار غير موجود.');
      }
      if (period.is_break === 1) {
        throw new BadRequestException('لا يمكن تسكين حصة في فترة راحة أو فسحة.');
      }
    }

    // Resolve teacher ID
    let teacherId = existingSlot.teaching_assignment?.teacher_id;
    if (dto.teaching_assignment_id) {
      const assignment = await this.prisma.teachingAssignment.findUnique({
        where: { id: BigInt(dto.teaching_assignment_id) },
      });
      if (!assignment || assignment.deleted_at) {
        throw new BadRequestException('إسناد التدريس المختار غير صالح.');
      }
      teacherId = assignment.teacher_id;
    }

    // Check section collision
    const sectionCollision = await this.prisma.timetableSlot.findFirst({
      where: {
        academic_year_id: academicYearId,
        class_section_id: classSectionId,
        day_of_week: dayOfWeek,
        period_slot_id: periodSlotId,
        NOT: { id: BigInt(id) },
      },
    });
    if (sectionCollision && !sectionCollision.deleted_at) {
      throw new ConflictException(
        'تعارض في الجدول: الشعبة مرتبطة بحصة أخرى في نفس اليوم والتوقيت (uq_timetable_section_slot).',
      );
    }
    if (sectionCollision && sectionCollision.deleted_at) {
      await this.prisma.timetableSlot.delete({
        where: { id: sectionCollision.id },
      });
    }

    // Check teacher collision
    if (teacherId) {
      const teacherCollision = await this.prisma.timetableSlot.findFirst({
        where: {
          academic_year_id: academicYearId,
          day_of_week: dayOfWeek,
          period_slot_id: periodSlotId,
          deleted_at: null,
          teaching_assignment: {
            teacher_id: teacherId,
          },
          NOT: { id: BigInt(id) },
        },
      });
      if (teacherCollision) {
        throw new ConflictException(
          'تعارض في الجدول: المعلم مرتبط بحصة أخرى مع شعبة أخرى في نفس اليوم والتوقيت.',
        );
      }
    }

    // Update slot
    const updatedSlot = await this.prisma.timetableSlot.update({
      where: { id: BigInt(id) },
      data: {
        academic_year_id: academicYearId,
        class_section_id: classSectionId,
        day_of_week: dayOfWeek,
        period_slot_id: periodSlotId,
        teaching_assignment_id: teachingAssignmentId,
      },
      include: {
        academic_year: true,
        period_slot: true,
        class_section: {
          include: {
            class: true,
            section: true,
          },
        },
        teaching_assignment: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      userId: BigInt(userId),
      action: 'update',
      entityType: 'timetable_slots',
      entityId: BigInt(id),
      oldValues: {
        academic_year_id: Number(existingSlot.academic_year_id),
        class_section_id: Number(existingSlot.class_section_id),
        day_of_week: existingSlot.day_of_week,
        period_slot_id: Number(existingSlot.period_slot_id),
        teaching_assignment_id: Number(existingSlot.teaching_assignment_id),
      },
      newValues: dto,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث وتعديل الحصة بالجدول الأسبوعي بنجاح.',
      data: {
        id: Number(updatedSlot.id),
        academic_year_id: Number(updatedSlot.academic_year_id),
        academic_year_name: updatedSlot.academic_year?.name || '',
        class_id: Number(updatedSlot.class_section?.class_id || 0),
        class_name: updatedSlot.class_section?.class?.name || '',
        class_section_id: Number(updatedSlot.class_section_id),
        section_name: updatedSlot.class_section?.section?.name || '',
        subject_id: Number(updatedSlot.teaching_assignment?.subject_id || 0),
        subject_name: updatedSlot.teaching_assignment?.subject?.name || '',
        teacher_id: Number(updatedSlot.teaching_assignment?.teacher_id || 0),
        teacher_name: updatedSlot.teaching_assignment?.teacher?.full_name || '',
        day_of_week: updatedSlot.day_of_week,
        day_of_week_ar: DAY_ARABIC_MAP[updatedSlot.day_of_week] || updatedSlot.day_of_week,
        period_slot_id: Number(updatedSlot.period_slot_id),
        period_name: updatedSlot.period_slot?.name || '',
      },
    };
  }

  /**
   * 1.6 DELETE /api/v1/timetable-slots/:id
   * Soft delete timetable slot
   */
  async remove(
    id: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existingSlot = await this.prisma.timetableSlot.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingSlot || existingSlot.deleted_at) {
      throw new NotFoundException('سجل الحصة بالجدول غير موجود.');
    }

    await this.prisma.timetableSlot.update({
      where: { id: BigInt(id) },
      data: {
        deleted_at: new Date(),
      },
    });

    await this.auditService.log({
      userId: BigInt(userId),
      action: 'delete',
      entityType: 'timetable_slots',
      entityId: BigInt(id),
      oldValues: {
        academic_year_id: Number(existingSlot.academic_year_id),
        class_section_id: Number(existingSlot.class_section_id),
        day_of_week: existingSlot.day_of_week,
        period_slot_id: Number(existingSlot.period_slot_id),
        teaching_assignment_id: Number(existingSlot.teaching_assignment_id),
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم حذف وإلغاء الحصة من الجدول الأسبوعي بنجاح.',
    };
  }
}
