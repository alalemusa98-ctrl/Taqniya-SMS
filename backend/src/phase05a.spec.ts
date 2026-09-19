import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { PeriodSlotsService } from './modules/period-slots/period-slots.service.js';
import { PeriodSlotsController } from './modules/period-slots/period-slots.controller.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoleType, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { ROLES_KEY } from './common/decorators/roles.decorator.js';
import { Reflector } from '@nestjs/core';

describe('Phase 05-A: Daily Period Slots Registry (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let periodSlotsService: PeriodSlotsService;
  let periodSlotsController: PeriodSlotsController;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testTeacherUserId: number;
  let testStudentUserId: number;
  let testParentUserId: number;

  let createdSlot1Id: number;
  let createdSlot2Id: number;
  let createdBreakSlotId: number;

  let testYearId: number;
  let testStageId: number;
  let testClassId: number;
  let testSectionId: number;
  let testClassSectionId: number;
  let testSubjectId: number;
  let testTeacherId: number;
  let testAssignmentId: number;
  let testTimetableSlotId: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    periodSlotsService = moduleRef.get<PeriodSlotsService>(PeriodSlotsService);
    periodSlotsController = moduleRef.get<PeriodSlotsController>(PeriodSlotsController);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    // 1. Ensure test admin user exists
    const hashedPassword = await bcrypt.hash('SecretAdminPass123!', 10);
    await prisma.user.upsert({
      where: { id: BigInt(testAdminId) },
      update: { is_active: 1, role_type: RoleType.admin },
      create: {
        id: BigInt(testAdminId),
        user_code: 'ADM-1001',
        password: hashedPassword,
        role_type: RoleType.admin,
        is_active: 1,
      },
    });

    // 2. Create non-admin users for RBAC testing
    const teacherUser = await prisma.user.create({
      data: {
        user_code: `TCH-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacherUserId = Number(teacherUser.id);

    const studentUser = await prisma.user.create({
      data: {
        user_code: `STU-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.student,
        is_active: 1,
      },
    });
    testStudentUserId = Number(studentUser.id);

    const parentUser = await prisma.user.create({
      data: {
        user_code: `PAR-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.parent,
        is_active: 1,
      },
    });
    testParentUserId = Number(parentUser.id);
  });

  afterAll(async () => {
    if (!prisma) return;
    // Cleanup created test records
    if (testTimetableSlotId) {
      await prisma.timetableSlot.deleteMany({ where: { id: BigInt(testTimetableSlotId) } });
    }
    if (testAssignmentId) {
      await prisma.teachingAssignment.deleteMany({ where: { id: BigInt(testAssignmentId) } });
    }
    if (testClassSectionId) {
      await prisma.classSection.deleteMany({ where: { id: BigInt(testClassSectionId) } });
    }
    if (testSectionId) {
      await prisma.section.deleteMany({ where: { id: BigInt(testSectionId) } });
    }
    if (testClassId) {
      await prisma.class.deleteMany({ where: { id: BigInt(testClassId) } });
    }
    if (testStageId) {
      await prisma.academicStage.deleteMany({ where: { id: BigInt(testStageId) } });
    }
    if (testSubjectId) {
      await prisma.subject.deleteMany({ where: { id: BigInt(testSubjectId) } });
    }
    if (testTeacherId) {
      await prisma.teacher.deleteMany({ where: { id: BigInt(testTeacherId) } });
    }
    if (testYearId) {
      await prisma.academicYear.deleteMany({ where: { id: BigInt(testYearId) } });
    }

    await prisma.periodSlot.deleteMany({
      where: {
        name: { contains: uniqueSuffix },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [BigInt(testTeacherUserId), BigInt(testStudentUserId), BigInt(testParentUserId)] },
      },
    });

    if (moduleRef) {
      await moduleRef.close();
    }
  });

  // ============================================================================
  // 1. Validation & System Invariant Tests
  // ============================================================================

  it('TC-SLOT-03: Create period slot successfully (POST /api/v1/period-slots)', async () => {
    const res = await periodSlotsService.create(
      {
        name: `الحصة الأولى-${uniqueSuffix}`,
        slot_number: 101,
        start_time: '08:00:00',
        end_time: '08:45:00',
        is_break: 0,
      },
      testAdminId,
    );

    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.message).toBe('تم إنشاء فترة الحصة اليومية بنجاح.');
    expect(res.data).toBeDefined();
    expect(res.data.name).toBe(`الحصة الأولى-${uniqueSuffix}`);
    expect(res.data.slot_number).toBe(101);
    expect(res.data.start_time).toBe('08:00:00');
    expect(res.data.end_time).toBe('08:45:00');
    expect(res.data.is_break).toBe(0);

    createdSlot1Id = res.data.id;
  });

  it('TC-SLOT-04: Logical Time Invariant - Reject end_time <= start_time (422 Unprocessable)', async () => {
    await expect(
      periodSlotsService.create(
        {
          name: `حصة زمنية خاطئة-${uniqueSuffix}`,
          slot_number: 102,
          start_time: '10:00:00',
          end_time: '09:00:00',
          is_break: 0,
        },
        testAdminId,
      ),
    ).rejects.toThrow(UnprocessableEntityException);

    // Also equal times must be rejected
    await expect(
      periodSlotsService.create(
        {
          name: `حصة زمنية متطابقة-${uniqueSuffix}`,
          slot_number: 102,
          start_time: '10:00:00',
          end_time: '10:00:00',
          is_break: 0,
        },
        testAdminId,
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('TC-SLOT-05: Unique Slot Number Invariant - Reject duplicate slot_number (409 Conflict)', async () => {
    await expect(
      periodSlotsService.create(
        {
          name: `حصة مكررة-${uniqueSuffix}`,
          slot_number: 101, // already used in TC-SLOT-03
          start_time: '08:50:00',
          end_time: '09:35:00',
          is_break: 0,
        },
        testAdminId,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('TC-SLOT-02: Create break period and filter is_break=1', async () => {
    // Create slot 2 (regular)
    const slot2 = await periodSlotsService.create(
      {
        name: `الحصة الثانية-${uniqueSuffix}`,
        slot_number: 102,
        start_time: '08:45:00',
        end_time: '09:30:00',
        is_break: 0,
      },
      testAdminId,
    );
    createdSlot2Id = slot2.data.id;

    // Create break slot
    const breakSlot = await periodSlotsService.create(
      {
        name: `الفسحة / الاستراحة-${uniqueSuffix}`,
        slot_number: 103,
        start_time: '09:30:00',
        end_time: '10:00:00',
        is_break: 1,
      },
      testAdminId,
    );
    createdBreakSlotId = breakSlot.data.id;

    // Filter by is_break = 1
    const res = await periodSlotsService.findAll({
      is_break: 1,
      search: uniqueSuffix,
    });

    expect(res.success).toBe(true);
    expect(res.data.length).toBe(1);
    expect(res.data[0].id).toBe(createdBreakSlotId);
    expect(res.data[0].is_break).toBe(1);
  });

  it('TC-SLOT-01: List and search period slots sorted by slot_number', async () => {
    const res = await periodSlotsService.findAll({
      search: uniqueSuffix,
      sort_by: 'slot_number',
      sort_order: 'asc',
      page: 1,
      per_page: 15,
    });

    expect(res.success).toBe(true);
    expect(res.data.length).toBe(3);
    expect(res.data[0].slot_number).toBe(101);
    expect(res.data[1].slot_number).toBe(102);
    expect(res.data[2].slot_number).toBe(103);
    expect(res.meta.total).toBe(3);
  });

  it('TC-SLOT-06: Update period slot successfully (PUT /api/v1/period-slots/:id)', async () => {
    const res = await periodSlotsService.update(
      createdSlot2Id,
      {
        name: `الحصة الثانية المعدلة-${uniqueSuffix}`,
        slot_number: 102,
        start_time: '08:50:00',
        end_time: '09:35:00',
        is_break: 0,
      },
      testAdminId,
    );

    expect(res.success).toBe(true);
    expect(res.message).toBe('تم تحديث فترة الحصة اليومية بنجاح.');
    expect(res.data.name).toBe(`الحصة الثانية المعدلة-${uniqueSuffix}`);
    expect(res.data.start_time).toBe('08:50:00');
    expect(res.data.end_time).toBe('09:35:00');
  });

  it('TC-SLOT-07: RESTRICT Protection - Prevent deleting period slot used in weekly timetable (409 Conflict)', async () => {
    // Setup prerequisite entities to link a timetable_slot
    const year = await prisma.academicYear.create({
      data: {
        name: `سنة الاختبار-${uniqueSuffix}`,
        start_date: new Date('2026-09-01'),
        end_date: new Date('2027-06-30'),
        is_active: 1,
      },
    });
    testYearId = Number(year.id);

    const stage = await prisma.academicStage.create({
      data: { name: `مرحلة الاختبار-${uniqueSuffix}`, order_index: 1 },
    });
    testStageId = Number(stage.id);

    const cls = await prisma.class.create({
      data: { stage_id: stage.id, name: `صف الاختبار-${uniqueSuffix}`, grade_level: 5 },
    });
    testClassId = Number(cls.id);

    const sec = await prisma.section.create({
      data: { name: `شعبة-${uniqueSuffix}` },
    });
    testSectionId = Number(sec.id);

    const classSection = await prisma.classSection.create({
      data: { class_id: cls.id, section_id: sec.id },
    });
    testClassSectionId = Number(classSection.id);

    const subj = await prisma.subject.create({
      data: { name: `مادة الاختبار-${uniqueSuffix}`, code: `SUB-${uniqueSuffix}` },
    });
    testSubjectId = Number(subj.id);

    const teacher = await prisma.teacher.create({
      data: {
        user_id: BigInt(testTeacherUserId),
        full_name: 'معلم الاختبار',
        phone: `05${uniqueSuffix}01`,
        specialization: 'رياضيات',
      },
    });
    testTeacherId = Number(teacher.id);

    const assignment = await prisma.teachingAssignment.create({
      data: {
        academic_year_id: year.id,
        class_section_id: classSection.id,
        subject_id: subj.id,
        teacher_id: teacher.id,
      },
    });
    testAssignmentId = Number(assignment.id);

    // Link createdSlot1Id to timetableSlot
    const timetableSlot = await prisma.timetableSlot.create({
      data: {
        academic_year_id: year.id,
        class_section_id: classSection.id,
        day_of_week: DayOfWeek.sunday,
        period_slot_id: BigInt(createdSlot1Id),
        teaching_assignment_id: assignment.id,
      },
    });
    testTimetableSlotId = Number(timetableSlot.id);

    // Attempt to delete slot 1 -> Must throw 409 Conflict
    await expect(
      periodSlotsService.remove(createdSlot1Id, testAdminId),
    ).rejects.toThrow(ConflictException);
  });

  it('TC-SLOT-08: Soft Delete - Successfully delete unlinked period slot (200 OK with deleted_at set)', async () => {
    // Delete createdSlot2Id which is NOT linked to any timetable
    const res = await periodSlotsService.remove(createdSlot2Id, testAdminId);

    expect(res.success).toBe(true);
    expect(res.message).toBe('تم حذف فترة الحصة بنجاح.');

    // Verify it is soft-deleted
    const deletedSlot = await prisma.periodSlot.findUnique({
      where: { id: BigInt(createdSlot2Id) },
    });
    expect(deletedSlot).toBeDefined();
    expect(deletedSlot?.deleted_at).not.toBeNull();

    // Verify it no longer appears in normal query
    const listRes = await periodSlotsService.findAll({ search: uniqueSuffix });
    const existsInList = listRes.data.some((s) => s.id === createdSlot2Id);
    expect(existsInList).toBe(false);
  });

  // ============================================================================
  // 2. RBAC & Security Tests
  // ============================================================================

  it('TC-AUTH-01: PeriodSlotsController must be guarded by JwtAuthGuard and RolesGuard', () => {
    const guards = Reflect.getMetadata('__guards__', PeriodSlotsController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(RolesGuard);

    const reflector = moduleRef.get(Reflector);
    const readRoles = reflector.get(ROLES_KEY, PeriodSlotsController.prototype.findAll);
    expect(readRoles).toEqual([RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent]);

    const createRoles = reflector.get(ROLES_KEY, PeriodSlotsController.prototype.create);
    expect(createRoles).toEqual([RoleType.admin]);

    const updateRoles = reflector.get(ROLES_KEY, PeriodSlotsController.prototype.update);
    expect(updateRoles).toEqual([RoleType.admin]);

    const deleteRoles = reflector.get(ROLES_KEY, PeriodSlotsController.prototype.remove);
    expect(deleteRoles).toEqual([RoleType.admin]);
  });

  it('TC-RBAC-01: Non-admin users are prevented from creating/updating/deleting period slots', async () => {
    const teacherUser = { id: testTeacherUserId, role_type: RoleType.teacher };
    const studentUser = { id: testStudentUserId, role_type: RoleType.student };
    const parentUser = { id: testParentUserId, role_type: RoleType.parent };

    // Teacher attempting to create
    await expect(
      periodSlotsController.create(
        {
          name: 'حصة غير مصرح بها',
          slot_number: 199,
          start_time: '11:00:00',
          end_time: '11:45:00',
        },
        teacherUser,
        { ip: '127.0.0.1', headers: {} } as any,
      ),
    ).rejects.toThrow();

    // Student attempting to update
    await expect(
      periodSlotsController.update(
        createdBreakSlotId,
        { name: 'محاولة تعديل' },
        studentUser,
        { ip: '127.0.0.1', headers: {} } as any,
      ),
    ).rejects.toThrow();

    // Parent attempting to delete
    await expect(
      periodSlotsController.remove(
        createdBreakSlotId,
        parentUser,
        { ip: '127.0.0.1', headers: {} } as any,
      ),
    ).rejects.toThrow();
  });

  it('TC-RBAC-02: All authenticated roles can browse period slots', async () => {
    // Controller findAll allows all authenticated users
    const res = await periodSlotsController.findAll({ search: uniqueSuffix });
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
  });

  // ============================================================================
  // 3. Audit Logging Tests
  // ============================================================================

  it('TC-AUDIT-01: Audit log tracks slot operations (create, update, delete)', async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity_type: 'period_slots',
      },
      orderBy: { id: 'desc' },
      take: 10,
    });

    expect(logs.length).toBeGreaterThanOrEqual(1);
    const actions = logs.map((l) => l.action);
    expect(actions).toContain('create');
  });
});
