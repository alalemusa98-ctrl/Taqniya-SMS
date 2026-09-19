import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { TimetablesService } from './modules/timetables/timetables.service.js';
import { TimetablesController } from './modules/timetables/timetables.controller.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RoleType, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 05-B: Timetables Registry & Conflict Resolution (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let timetablesService: TimetablesService;
  let timetablesController: TimetablesController;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testTeacherUserId: number;
  let testTeacher2UserId: number;
  let testStudentUserId: number;

  let testAcademicYearId: number;
  let testStageId: number;
  let testClassId: number;
  let testSection1Id: number;
  let testSection2Id: number;
  let testClassSection1Id: number;
  let testClassSection2Id: number;

  let testSubjectMathId: number;
  let testSubjectScienceId: number;
  let testTeacher1Id: number;
  let testTeacher2Id: number;

  let testAssignment1Id: number; // Teacher 1 -> Section 1 (Math)
  let testAssignment2Id: number; // Teacher 1 -> Section 2 (Math)
  let testAssignment3Id: number; // Teacher 2 -> Section 1 (Science)

  let testPeriod1Id: number;
  let testPeriod2Id: number;
  let testBreakPeriodId: number;

  let createdSlot1Id: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    timetablesService = moduleRef.get<TimetablesService>(TimetablesService);
    timetablesController = moduleRef.get<TimetablesController>(TimetablesController);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    const hashedPassword = await bcrypt.hash('SecretAdminPass123!', 10);

    // 1. Ensure Admin User
    await prisma.user.upsert({
      where: { id: BigInt(testAdminId) },
      update: { is_active: 1, role_type: RoleType.admin },
      create: {
        id: BigInt(testAdminId),
        user_code: 'ADM-TT-01',
        password: hashedPassword,
        role_type: RoleType.admin,
        is_active: 1,
      },
    });

    // 2. Create Non-Admin Users
    const tUser1 = await prisma.user.create({
      data: {
        user_code: `TCH1-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacherUserId = Number(tUser1.id);

    const tUser2 = await prisma.user.create({
      data: {
        user_code: `TCH2-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacher2UserId = Number(tUser2.id);

    const sUser = await prisma.user.create({
      data: {
        user_code: `STU-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.student,
        is_active: 1,
      },
    });
    testStudentUserId = Number(sUser.id);

    // 3. Academic Entities
    const year = await prisma.academicYear.create({
      data: {
        name: `Year-TT-${uniqueSuffix}`,
        start_date: new Date('2026-09-01'),
        end_date: new Date('2027-06-30'),
        is_active: 1,
      },
    });
    testAcademicYearId = Number(year.id);

    const stage = await prisma.academicStage.create({
      data: {
        name: `Stage-TT-${uniqueSuffix}`,
        order_index: Math.floor(Math.random() * 80) + 1,
      },
    });
    testStageId = Number(stage.id);

    const cls = await prisma.class.create({
      data: {
        stage_id: stage.id,
        name: `Class-TT-${uniqueSuffix}`,
        grade_level: 5,
      },
    });
    testClassId = Number(cls.id);

    const sec1 = await prisma.section.create({
      data: { name: `SecA-TT-${uniqueSuffix}` },
    });
    testSection1Id = Number(sec1.id);

    const sec2 = await prisma.section.create({
      data: { name: `SecB-TT-${uniqueSuffix}` },
    });
    testSection2Id = Number(sec2.id);

    const cs1 = await prisma.classSection.create({
      data: {
        class_id: cls.id,
        section_id: sec1.id,
      },
    });
    testClassSection1Id = Number(cs1.id);

    const cs2 = await prisma.classSection.create({
      data: {
        class_id: cls.id,
        section_id: sec2.id,
      },
    });
    testClassSection2Id = Number(cs2.id);

    // 4. Subjects & Teachers
    const sub1 = await prisma.subject.create({
      data: {
        name: `Math-TT-${uniqueSuffix}`,
        code: `MTH-${uniqueSuffix}`,
      },
    });
    testSubjectMathId = Number(sub1.id);

    const sub2 = await prisma.subject.create({
      data: {
        name: `Science-TT-${uniqueSuffix}`,
        code: `SCI-${uniqueSuffix}`,
      },
    });
    testSubjectScienceId = Number(sub2.id);

    const tch1 = await prisma.teacher.create({
      data: {
        user_id: tUser1.id,
        full_name: `Teacher One ${uniqueSuffix}`,
        specialization: 'Math',
      },
    });
    testTeacher1Id = Number(tch1.id);

    const tch2 = await prisma.teacher.create({
      data: {
        user_id: tUser2.id,
        full_name: `Teacher Two ${uniqueSuffix}`,
        specialization: 'Science',
      },
    });
    testTeacher2Id = Number(tch2.id);

    // 5. Teaching Assignments
    const asgn1 = await prisma.teachingAssignment.create({
      data: {
        academic_year_id: year.id,
        class_section_id: cs1.id,
        subject_id: sub1.id,
        teacher_id: tch1.id,
      },
    });
    testAssignment1Id = Number(asgn1.id);

    const asgn2 = await prisma.teachingAssignment.create({
      data: {
        academic_year_id: year.id,
        class_section_id: cs2.id,
        subject_id: sub1.id,
        teacher_id: tch1.id, // Teacher 1 also teaches Section 2
      },
    });
    testAssignment2Id = Number(asgn2.id);

    const asgn3 = await prisma.teachingAssignment.create({
      data: {
        academic_year_id: year.id,
        class_section_id: cs1.id,
        subject_id: sub2.id,
        teacher_id: tch2.id, // Teacher 2 teaches Section 1 Science
      },
    });
    testAssignment3Id = Number(asgn3.id);

    // 6. Period Slots
    const existingSlots = await prisma.periodSlot.findMany({
      select: { slot_number: true },
    });
    const usedSlotNumbers = new Set(existingSlots.map((s) => s.slot_number));
    let slotCandidate = 1;
    const getNextSlotNumber = () => {
      while (usedSlotNumbers.has(slotCandidate) && slotCandidate < 120) {
        slotCandidate++;
      }
      usedSlotNumbers.add(slotCandidate);
      return slotCandidate;
    };

    const p1 = await prisma.periodSlot.create({
      data: {
        name: `Period 1 ${uniqueSuffix}`,
        slot_number: getNextSlotNumber(),
        start_time: new Date('1970-01-01T08:00:00Z'),
        end_time: new Date('1970-01-01T08:45:00Z'),
        is_break: 0,
      },
    });
    testPeriod1Id = Number(p1.id);

    const p2 = await prisma.periodSlot.create({
      data: {
        name: `Period 2 ${uniqueSuffix}`,
        slot_number: getNextSlotNumber(),
        start_time: new Date('1970-01-01T08:50:00Z'),
        end_time: new Date('1970-01-01T09:35:00Z'),
        is_break: 0,
      },
    });
    testPeriod2Id = Number(p2.id);

    const pBreak = await prisma.periodSlot.create({
      data: {
        name: `Break ${uniqueSuffix}`,
        slot_number: getNextSlotNumber(),
        start_time: new Date('1970-01-01T09:35:00Z'),
        end_time: new Date('1970-01-01T10:00:00Z'),
        is_break: 1,
      },
    });
    testBreakPeriodId = Number(pBreak.id);
  });

  afterAll(async () => {
    if (!prisma) return;
    // Clean up test data
    if (testAcademicYearId) {
      await prisma.timetableSlot.deleteMany({
        where: { academic_year_id: BigInt(testAcademicYearId) },
      });
      await prisma.teachingAssignment.deleteMany({
        where: { academic_year_id: BigInt(testAcademicYearId) },
      });
    }
    if (testPeriod1Id) {
      await prisma.periodSlot.deleteMany({
        where: { id: { in: [BigInt(testPeriod1Id), BigInt(testPeriod2Id), BigInt(testBreakPeriodId)] } },
      });
    }
    if (testTeacher1Id) {
      await prisma.teacher.deleteMany({
        where: { id: { in: [BigInt(testTeacher1Id), BigInt(testTeacher2Id)] } },
      });
    }
    if (testSubjectMathId) {
      await prisma.subject.deleteMany({
        where: { id: { in: [BigInt(testSubjectMathId), BigInt(testSubjectScienceId)] } },
      });
    }
    if (testClassSection1Id) {
      await prisma.classSection.deleteMany({
        where: { id: { in: [BigInt(testClassSection1Id), BigInt(testClassSection2Id)] } },
      });
    }
    if (testSection1Id) {
      await prisma.section.deleteMany({
        where: { id: { in: [BigInt(testSection1Id), BigInt(testSection2Id)] } },
      });
    }
    if (testClassId) {
      await prisma.class.deleteMany({
        where: { id: BigInt(testClassId) },
      });
    }
    if (testStageId) {
      await prisma.academicStage.deleteMany({
        where: { id: BigInt(testStageId) },
      });
    }
    if (testAcademicYearId) {
      await prisma.academicYear.deleteMany({
        where: { id: BigInt(testAcademicYearId) },
      });
    }
    if (testTeacherUserId) {
      await prisma.user.deleteMany({
        where: { id: { in: [BigInt(testTeacherUserId), BigInt(testTeacher2UserId), BigInt(testStudentUserId)] } },
      });
    }
  });

  describe('1.1 Structure Overview (GET /api/v1/timetable-slots)', () => {
    it('TC-TT-01: Should retrieve classes and sections structure for academic year', async () => {
      const result = await timetablesService.findStructure({
        academic_year_id: testAcademicYearId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.academic_year_id).toBe(testAcademicYearId);
      expect(Array.isArray(result.data.classes)).toBe(true);

      const foundClass = result.data.classes.find((c: any) => c.class_id === testClassId);
      expect(foundClass).toBeDefined();
      expect(foundClass.sections.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('1.2 Completion Audit Status (GET /api/v1/timetable-slots/completion-status)', () => {
    it('TC-TT-02: Should compute completion status and count unscheduled slots', async () => {
      const result = await timetablesService.getCompletionStatus({
        academic_year_id: testAcademicYearId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.academic_year_id).toBe(testAcademicYearId);
      expect(typeof result.data.total_unscheduled_school_slots).toBe('number');
      expect(Array.isArray(result.data.classes)).toBe(true);
    });
  });

  describe('1.5 Create Timetable Slot (POST /api/v1/timetable-slots)', () => {
    it('TC-TT-03: Should schedule a new slot successfully', async () => {
      const result = await timetablesService.create(
        {
          academic_year_id: testAcademicYearId,
          class_section_id: testClassSection1Id,
          day_of_week: DayOfWeek.sunday,
          period_slot_id: testPeriod1Id,
          teaching_assignment_id: testAssignment1Id,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.class_section_id).toBe(testClassSection1Id);
      expect(result.data.day_of_week).toBe('sunday');
      expect(result.data.day_of_week_ar).toBe('الأحد');
      expect(result.data.period_slot_id).toBe(testPeriod1Id);
      expect(result.data.teacher_name).toBeDefined();

      createdSlot1Id = result.data.id;
    });

    it('TC-TT-04: Should reject scheduling on a break period slot with BadRequestException', async () => {
      await expect(
        timetablesService.create(
          {
            academic_year_id: testAcademicYearId,
            class_section_id: testClassSection1Id,
            day_of_week: DayOfWeek.sunday,
            period_slot_id: testBreakPeriodId,
            teaching_assignment_id: testAssignment1Id,
          },
          testAdminId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('TC-TT-05: Should reject duplicate section slot collision with ConflictException (uq_timetable_section_slot)', async () => {
      await expect(
        timetablesService.create(
          {
            academic_year_id: testAcademicYearId,
            class_section_id: testClassSection1Id,
            day_of_week: DayOfWeek.sunday,
            period_slot_id: testPeriod1Id,
            teaching_assignment_id: testAssignment3Id, // Different assignment, same section/day/period
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-TT-06: Should reject teacher collision with ConflictException (Teacher scheduled in another section)', async () => {
      // Teacher 1 is already teaching Section 1 at Sunday Period 1.
      // Now try scheduling Teacher 1 (via assignment 2) in Section 2 at the same Sunday Period 1!
      await expect(
        timetablesService.create(
          {
            academic_year_id: testAcademicYearId,
            class_section_id: testClassSection2Id,
            day_of_week: DayOfWeek.sunday,
            period_slot_id: testPeriod1Id,
            teaching_assignment_id: testAssignment2Id, // Teacher 1
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('1.3 Section Timetable Matrix (GET /api/v1/class-sections/:class_section_id/timetable)', () => {
    it('TC-TT-07: Should retrieve section weekly timetable grouped by day', async () => {
      const result = await timetablesService.getSectionTimetable(testClassSection1Id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.class_section_id).toBe(testClassSection1Id);
      expect(Array.isArray(result.data.timetable)).toBe(true);

      const sunday = result.data.timetable.find((d: any) => d.day_of_week === 'sunday');
      expect(sunday).toBeDefined();
      expect(sunday.slots.length).toBeGreaterThanOrEqual(1);
      expect(sunday.slots[0].period_slot_id).toBe(testPeriod1Id);
    });
  });

  describe('1.4 Teacher Timetable Matrix (GET /api/v1/teachers/:teacher_id/timetable)', () => {
    it('TC-TT-08: Should retrieve teacher weekly timetable', async () => {
      const result = await timetablesService.getTeacherTimetable(testTeacher1Id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.teacher_id).toBe(testTeacher1Id);
      expect(Array.isArray(result.data.timetable)).toBe(true);

      const sunday = result.data.timetable.find((d: any) => d.day_of_week === 'sunday');
      expect(sunday).toBeDefined();
      expect(sunday.slots.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('1.5 Update Timetable Slot (PUT /api/v1/timetable-slots/:id)', () => {
    it('TC-TT-09: Should update timetable slot period successfully', async () => {
      const result = await timetablesService.update(
        createdSlot1Id,
        {
          period_slot_id: testPeriod2Id,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.period_slot_id).toBe(testPeriod2Id);
    });
  });

  describe('1.6 Delete Timetable Slot (DELETE /api/v1/timetable-slots/:id)', () => {
    it('TC-TT-10: Should soft-delete timetable slot and free the period', async () => {
      const result = await timetablesService.remove(createdSlot1Id, testAdminId);
      expect(result.success).toBe(true);

      // Verify slot is soft-deleted
      const check = await prisma.timetableSlot.findUnique({
        where: { id: BigInt(createdSlot1Id) },
      });
      expect(check?.deleted_at).not.toBeNull();
    });
  });

  describe('RBAC & Security Constraints', () => {
    it('TC-AUTH-01: Controller should be guarded with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', TimetablesController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThanOrEqual(2);
    });

    it('TC-NOTFOUND-01: Should throw NotFoundException when updating or deleting non-existent slot', async () => {
      await expect(
        timetablesService.update(999999, { period_slot_id: testPeriod1Id }, testAdminId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        timetablesService.remove(999999, testAdminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-TT-11: Non-admin users cannot manage timetable slots or view completion status', async () => {
      const teacherUser = { id: testTeacherUserId, role_type: RoleType.teacher };

      await expect(
        timetablesController.create(
          {
            academic_year_id: testAcademicYearId,
            class_section_id: testClassSection1Id,
            day_of_week: DayOfWeek.monday,
            period_slot_id: testPeriod1Id,
            teaching_assignment_id: testAssignment1Id,
          },
          teacherUser as any,
          {} as any,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        timetablesController.getCompletionStatus(
          { academic_year_id: testAcademicYearId },
          teacherUser as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
