import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { TeachingAssignmentsService } from './modules/teaching-assignments/teaching-assignments.service.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import { ConflictException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 03-B: Teaching Assignments Registry (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let assignmentsService: TeachingAssignmentsService;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testYearId: number;
  let testStageId: number;
  let testClassId: number;
  let testSectionId: number;
  let testSubjectId1: number;
  let testSubjectId2: number;
  let testTeacherId1: number;
  let testTeacherUserId1: number;
  let testTeacherId2: number;
  let testTeacherUserId2: number;

  let createdAssignmentId: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    assignmentsService = moduleRef.get<TeachingAssignmentsService>(TeachingAssignmentsService);
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

    // 2. Setup Academic Year
    const year = await prisma.academicYear.create({
      data: {
        name: `العام 2026/2027-${uniqueSuffix}`,
        start_date: new Date('2026-09-01'),
        end_date: new Date('2027-06-30'),
        is_active: 1,
      },
    });
    testYearId = Number(year.id);

    // 3. Setup Academic Stage, Class & Section
    const stage = await prisma.academicStage.create({
      data: {
        name: `مرحلة تجريبية-${uniqueSuffix}`,
        order_index: 99,
      },
    });
    testStageId = Number(stage.id);

    const cls = await prisma.class.create({
      data: {
        stage_id: BigInt(testStageId),
        name: `الصف التجريبي-${uniqueSuffix}`,
        grade_level: 1,
      },
    });
    testClassId = Number(cls.id);

    const baseSection = await prisma.section.create({
      data: {
        name: `شعبة تجريبية-${uniqueSuffix}`,
      },
    });

    const section = await prisma.classSection.create({
      data: {
        class_id: BigInt(testClassId),
        section_id: baseSection.id,
      },
    });
    testSectionId = Number(section.id);

    // 4. Setup Subjects
    const subject1 = await prisma.subject.create({
      data: {
        name: `الرياضيات المتقدمة-${uniqueSuffix}`,
        code: `MTH${uniqueSuffix.slice(-3)}`,
      },
    });
    testSubjectId1 = Number(subject1.id);

    const subject2 = await prisma.subject.create({
      data: {
        name: `الفيزياء التجريبية-${uniqueSuffix}`,
        code: `PHY${uniqueSuffix.slice(-3)}`,
      },
    });
    testSubjectId2 = Number(subject2.id);

    // 5. Setup Teachers & Accounts
    const userTeacher1 = await prisma.user.create({
      data: {
        user_code: `TCH-${uniqueSuffix.slice(-4)}1`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacherUserId1 = Number(userTeacher1.id);

    const teacher1 = await prisma.teacher.create({
      data: {
        user_id: BigInt(testTeacherUserId1),
        full_name: `معلم تجريبي 1-${uniqueSuffix}`,
        specialization: 'رياضيات',
      },
    });
    testTeacherId1 = Number(teacher1.id);

    const userTeacher2 = await prisma.user.create({
      data: {
        user_code: `TCH-${uniqueSuffix.slice(-4)}2`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacherUserId2 = Number(userTeacher2.id);

    const teacher2 = await prisma.teacher.create({
      data: {
        user_id: BigInt(testTeacherUserId2),
        full_name: `معلم تجريبي 2-${uniqueSuffix}`,
        specialization: 'فيزياء',
      },
    });
    testTeacherId2 = Number(teacher2.id);
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.teachingAssignment.deleteMany({
      where: { academic_year_id: BigInt(testYearId) },
    });
    await prisma.teacher.deleteMany({
      where: { id: { in: [BigInt(testTeacherId1), BigInt(testTeacherId2)] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [BigInt(testTeacherUserId1), BigInt(testTeacherUserId2)] } },
    });
    await prisma.subject.deleteMany({
      where: { id: { in: [BigInt(testSubjectId1), BigInt(testSubjectId2)] } },
    });
    await prisma.classSection.deleteMany({
      where: { id: BigInt(testSectionId) },
    });
    await prisma.class.deleteMany({
      where: { id: BigInt(testClassId) },
    });
    await prisma.academicStage.deleteMany({
      where: { id: BigInt(testStageId) },
    });
    await prisma.academicYear.deleteMany({
      where: { id: BigInt(testYearId) },
    });

    await prisma.$disconnect();
    await moduleRef.close();
  });

  describe('Group 1: Teaching Assignment Creation & Validation (TC-ASN-05, TC-ASN-06, TC-ASN-07)', () => {
    it('TC-ASN-05: Successfully assigns a teacher to a subject in a section (201 Created)', async () => {
      const dto = {
        academic_year_id: testYearId,
        class_section_id: testSectionId,
        subject_id: testSubjectId1,
        teacher_id: testTeacherId1,
      };

      const result = await assignmentsService.create(dto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeGreaterThan(0);
      expect(result.data.academic_year_id).toBe(testYearId);
      expect(result.data.class_section_id).toBe(testSectionId);
      expect(result.data.subject_id).toBe(testSubjectId1);
      expect(result.data.teacher_id).toBe(testTeacherId1);

      createdAssignmentId = result.data.id;
    });

    it('TC-ASN-06: Invariant Check (uq_teaching_assignment) - rejects duplicate assignment with 409 Conflict', async () => {
      const dto = {
        academic_year_id: testYearId,
        class_section_id: testSectionId,
        subject_id: testSubjectId1,
        teacher_id: testTeacherId2, // Different teacher for same subject and section
      };

      await expect(assignmentsService.create(dto, testAdminId)).rejects.toThrow(ConflictException);
    });

    it('TC-ASN-07: Validation Check - rejects assignment if teacher does not exist or is inactive (422)', async () => {
      const dto = {
        academic_year_id: testYearId,
        class_section_id: testSectionId,
        subject_id: testSubjectId2,
        teacher_id: 999999, // Non-existent
      };

      await expect(assignmentsService.create(dto, testAdminId)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('Group 2: Browsing & Filtering Assignments (TC-ASN-01, TC-ASN-02, TC-ASN-03)', () => {
    it('TC-ASN-01: Retrieves hierarchical grouped assignments by classes -> sections -> assignments', async () => {
      const result = await assignmentsService.findAll({
        academic_year_id: testYearId,
        class_id: testClassId,
        page: 1,
        per_page: 15,
      });

      expect(result.success).toBe(true);
      expect(result.data.academic_year_id).toBe(testYearId);
      expect(Array.isArray(result.data.classes)).toBe(true);

      const targetClass = result.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();

      const targetSection = targetClass.sections.find((s: any) => s.class_section_id === testSectionId);
      expect(targetSection).toBeDefined();

      const assignment = targetSection.assignments.find((a: any) => a.id === createdAssignmentId);
      expect(assignment).toBeDefined();
      expect(assignment.teacher_id).toBe(testTeacherId1);
    });

    it('TC-ASN-02: Filters assignments by class_id', async () => {
      const result = await assignmentsService.findAll({
        academic_year_id: testYearId,
        class_id: testClassId,
      });

      expect(result.success).toBe(true);
      expect(result.data.classes.length).toBe(1);
      expect(result.data.classes[0].class_id).toBe(testClassId);
    });

    it('TC-ASN-03: Searches assignments by text (teacher name or subject name)', async () => {
      const result = await assignmentsService.findAll({
        academic_year_id: testYearId,
        search: `معلم تجريبي 1-${uniqueSuffix}`,
      });

      expect(result.success).toBe(true);
      const targetClass = result.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();
    });
  });

  describe('Group 3: Teacher Workload & IDOR Prevention (TC-ASN-04, TC-RBAC-02, TC-RBAC-03)', () => {
    it('TC-ASN-04 / TC-RBAC-03: Admin or teacher accessing own workload succeeds (200 OK)', async () => {
      const currentUser = { id: testTeacherUserId1, role_type: RoleType.teacher };
      const result = await assignmentsService.findTeacherAssignments(testTeacherId1, { academic_year_id: testYearId }, currentUser);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].subject_id).toBe(testSubjectId1);
      expect(result.data[0].class_section_id).toBe(testSectionId);
    });

    it('TC-RBAC-02: IDOR Prevention - teacher accessing another teacher workload gets 403 Forbidden', async () => {
      const teacher2User = { id: testTeacherUserId2, role_type: RoleType.teacher };
      await expect(
        assignmentsService.findTeacherAssignments(testTeacherId1, { academic_year_id: testYearId }, teacher2User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Group 4: Update & Reassignment (TC-ASN-08, TC-ASN-09)', () => {
    it('TC-ASN-08: Successfully updates assignment with new teacher (200 OK)', async () => {
      const updateDto = {
        academic_year_id: testYearId,
        class_section_id: testSectionId,
        subject_id: testSubjectId1,
        teacher_id: testTeacherId2, // Reassign to teacher 2
      };

      const result = await assignmentsService.update(createdAssignmentId, updateDto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.data.teacher_id).toBe(testTeacherId2);

      // Verify in DB
      const updatedRecord = await prisma.teachingAssignment.findUnique({
        where: { id: BigInt(createdAssignmentId) },
      });
      expect(Number(updatedRecord?.teacher_id)).toBe(testTeacherId2);
    });

    it('TC-ASN-09: Rejects update if it collides with another assignment in the section (409 Conflict)', async () => {
      // Create a second assignment for subject 2
      const second = await assignmentsService.create(
        {
          academic_year_id: testYearId,
          class_section_id: testSectionId,
          subject_id: testSubjectId2,
          teacher_id: testTeacherId1,
        },
        testAdminId,
      );

      // Attempt to update second assignment to have subject 1 (which already belongs to createdAssignmentId)
      const updateCollidingDto = {
        academic_year_id: testYearId,
        class_section_id: testSectionId,
        subject_id: testSubjectId1,
        teacher_id: testTeacherId1,
      };

      await expect(
        assignmentsService.update(second.data.id, updateCollidingDto, testAdminId),
      ).rejects.toThrow(ConflictException);

      // Cleanup second
      await prisma.teachingAssignment.delete({ where: { id: BigInt(second.data.id) } });
    });
  });

  describe('Group 5: Delete & Relational Integrity (TC-ASN-10, TC-ASN-11)', () => {
    it('TC-ASN-10: Restrict check prevents delete if linked to timetable slot (409 Conflict)', async () => {
      // 1. Create a period slot for timetable
      const period = await prisma.periodSlot.upsert({
        where: { slot_number: 99 },
        update: {},
        create: {
          name: `حصة تجريبية-${uniqueSuffix}`,
          slot_number: 99,
          start_time: new Date('1970-01-01T08:00:00Z'),
          end_time: new Date('1970-01-01T08:45:00Z'),
        },
      });

      // 2. Link timetable slot referencing createdAssignmentId
      const slot = await prisma.timetableSlot.create({
        data: {
          academic_year_id: BigInt(testYearId),
          class_section_id: BigInt(testSectionId),
          day_of_week: 'sunday',
          period_slot_id: period.id,
          teaching_assignment_id: BigInt(createdAssignmentId),
        },
      });

      await expect(
        assignmentsService.delete(createdAssignmentId, testAdminId),
      ).rejects.toThrow(ConflictException);

      // Clean up timetable slot
      await prisma.timetableSlot.delete({ where: { id: slot.id } });
    });

    it('TC-ASN-11: Successfully soft deletes unlinked assignment (200 OK)', async () => {
      const result = await assignmentsService.delete(createdAssignmentId, testAdminId);

      expect(result.success).toBe(true);

      const deletedRecord = await prisma.teachingAssignment.findUnique({
        where: { id: BigInt(createdAssignmentId) },
      });
      expect(deletedRecord?.deleted_at).not.toBeNull();
    });
  });

  describe('Group 6: Security, RBAC & Audit Verification (TC-AUTH-01, TC-AUTH-02, TC-RBAC-01, TC-AUDIT-01)', () => {
    it('TC-AUTH-01 & TC-AUTH-02: Verifies TeachingAssignmentsController is protected with JwtAuthGuard and RolesGuard', async () => {
      const { TeachingAssignmentsController } = await import('./modules/teaching-assignments/teaching-assignments.controller.js');
      const { JwtAuthGuard } = await import('./common/guards/jwt-auth.guard.js');
      const { RolesGuard } = await import('./common/guards/roles.guard.js');

      const guards = Reflect.getMetadata('__guards__', TeachingAssignmentsController);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('TC-RBAC-01: Verifies assignment mutation endpoints strictly require admin role and exclude teacher/student/parent', async () => {
      const { TeachingAssignmentsController } = await import('./modules/teaching-assignments/teaching-assignments.controller.js');
      const { ROLES_KEY } = await import('./common/decorators/roles.decorator.js');

      const createRoles = Reflect.getMetadata(ROLES_KEY, TeachingAssignmentsController.prototype.create);
      expect(createRoles).toEqual([RoleType.admin]);

      const updateRoles = Reflect.getMetadata(ROLES_KEY, TeachingAssignmentsController.prototype.update);
      expect(updateRoles).toEqual([RoleType.admin]);

      const deleteRoles = Reflect.getMetadata(ROLES_KEY, TeachingAssignmentsController.prototype.delete);
      expect(deleteRoles).toEqual([RoleType.admin]);

      const findAllRoles = Reflect.getMetadata(ROLES_KEY, TeachingAssignmentsController.prototype.findAll);
      expect(findAllRoles).toEqual([RoleType.admin]);

      // Ensure teacher, student, and parent roles are strictly forbidden from mutating assignments
      [createRoles, updateRoles, deleteRoles, findAllRoles].forEach((roles) => {
        expect(roles).not.toContain(RoleType.teacher);
        expect(roles).not.toContain(RoleType.student);
        expect(roles).not.toContain(RoleType.parent);
      });
    });

    it('TC-AUDIT-01: Verifies audit log records were created for assignment actions', async () => {
      const auditEntries = await prisma.auditLog.findMany({
        where: {
          entity_type: 'teaching_assignments',
          entity_id: BigInt(createdAssignmentId),
        },
      });

      expect(auditEntries.length).toBeGreaterThan(0);
      const actions = auditEntries.map((e) => e.action);
      expect(actions).toContain('TEACHING_ASSIGNMENT_CREATED');
      expect(actions).toContain('TEACHING_ASSIGNMENT_UPDATED');
      expect(actions).toContain('TEACHING_ASSIGNMENT_DELETED');
    });
  });
});

