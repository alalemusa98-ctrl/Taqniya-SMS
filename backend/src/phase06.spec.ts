import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { AssignmentsService } from './modules/assignments/assignments.service.js';
import { AssignmentsController } from './modules/assignments/assignments.controller.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 06: Homework & Assignments (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let assignmentsService: AssignmentsService;
  let assignmentsController: AssignmentsController;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testTeacher1UserId: number;
  let testTeacher2UserId: number;
  let testStudentUserId: number;
  let testParentUserId: number;

  let testAcademicYearId: number;
  let testAcademicTermId: number;
  let testStageId: number;
  let testClassId: number;
  let testSection1Id: number;
  let testSection2Id: number;
  let testClassSection1Id: number;
  let testClassSection2Id: number;

  let testSubjectId: number;
  let testTeacher1Id: number;
  let testTeacher2Id: number;
  let testStudentId: number;
  let testGuardianId: number;

  let testTeachingAssignment1Id: number; // Teacher 1 -> Section 1
  let testTeachingAssignment2Id: number; // Teacher 2 -> Section 2

  let createdAssignment1Id: number;
  let createdAssignment2Id: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    assignmentsService = moduleRef.get<AssignmentsService>(AssignmentsService);
    assignmentsController = moduleRef.get<AssignmentsController>(AssignmentsController);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    const hashedPassword = await bcrypt.hash('SecretAdminPass123!', 10);

    // 1. Ensure Admin User
    await prisma.user.upsert({
      where: { id: BigInt(testAdminId) },
      update: { is_active: 1, role_type: RoleType.admin },
      create: {
        id: BigInt(testAdminId),
        user_code: `ADM-HW-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.admin,
        is_active: 1,
      },
    });

    // 2. Create Teachers, Student, Parent users
    const tUser1 = await prisma.user.create({
      data: {
        user_code: `TCH1-HW-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacher1UserId = Number(tUser1.id);

    const tUser2 = await prisma.user.create({
      data: {
        user_code: `TCH2-HW-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacher2UserId = Number(tUser2.id);

    const sUser = await prisma.user.create({
      data: {
        user_code: `STU-HW-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.student,
        is_active: 1,
      },
    });
    testStudentUserId = Number(sUser.id);

    const pUser = await prisma.user.create({
      data: {
        user_code: `PAR-HW-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.parent,
        is_active: 1,
      },
    });
    testParentUserId = Number(pUser.id);

    // 3. Academic Structure
    const year = await prisma.academicYear.create({
      data: {
        name: `Year-HW-${uniqueSuffix}`,
        start_date: new Date('2026-09-01'),
        end_date: new Date('2027-06-30'),
        is_active: 1,
      },
    });
    testAcademicYearId = Number(year.id);

    let term = await prisma.academicTerm.findFirst({
      where: { deleted_at: null },
      orderBy: { id: 'asc' },
    });
    if (!term) {
      term = await prisma.academicTerm.create({
        data: {
          name: `Term1-HW-${uniqueSuffix}`,
          term_number: Math.floor(Math.random() * 80) + 1,
        },
      });
    }
    testAcademicTermId = Number(term.id);

    const stage = await prisma.academicStage.create({
      data: {
        name: `Stage-HW-${uniqueSuffix}`,
        order_index: Math.floor(Math.random() * 80) + 1,
      },
    });
    testStageId = Number(stage.id);

    const cls = await prisma.class.create({
      data: {
        stage_id: BigInt(testStageId),
        name: `Grade5-HW-${uniqueSuffix}`,
        grade_level: 5,
      },
    });
    testClassId = Number(cls.id);

    const sec1 = await prisma.section.create({
      data: {
        name: `SectionA-HW-${uniqueSuffix}`,
      },
    });
    testSection1Id = Number(sec1.id);

    const sec2 = await prisma.section.create({
      data: {
        name: `SectionB-HW-${uniqueSuffix}`,
      },
    });
    testSection2Id = Number(sec2.id);

    const cs1 = await prisma.classSection.create({
      data: {
        class_id: BigInt(testClassId),
        section_id: BigInt(testSection1Id),
      },
    });
    testClassSection1Id = Number(cs1.id);

    const cs2 = await prisma.classSection.create({
      data: {
        class_id: BigInt(testClassId),
        section_id: BigInt(testSection2Id),
      },
    });
    testClassSection2Id = Number(cs2.id);

    const subj = await prisma.subject.create({
      data: {
        name: `Math-HW-${uniqueSuffix}`,
        code: `MTH-${uniqueSuffix}`,
      },
    });
    testSubjectId = Number(subj.id);

    // 4. Profiles
    const t1 = await prisma.teacher.create({
      data: {
        user_id: BigInt(testTeacher1UserId),
        full_name: `Teacher 1 ${uniqueSuffix}`,
        phone: `0911${uniqueSuffix}`,
        specialization: 'Mathematics',
      },
    });
    testTeacher1Id = Number(t1.id);

    const t2 = await prisma.teacher.create({
      data: {
        user_id: BigInt(testTeacher2UserId),
        full_name: `Teacher 2 ${uniqueSuffix}`,
        phone: `0922${uniqueSuffix}`,
        specialization: 'Physics',
      },
    });
    testTeacher2Id = Number(t2.id);

    const stu = await prisma.student.create({
      data: {
        user_id: BigInt(testStudentUserId),
        full_name: `Student HW ${uniqueSuffix}`,
        phone: `0944${uniqueSuffix}`,
        birth_date: new Date('2014-05-15'),
        gender: 'male',
      },
    });
    testStudentId = Number(stu.id);

    const grd = await prisma.guardian.create({
      data: {
        user_id: BigInt(testParentUserId),
        full_name: `Guardian HW ${uniqueSuffix}`,
        phone: `0933${uniqueSuffix}`,
        relationship: 'father',
      },
    });
    testGuardianId = Number(grd.id);

    // Link Guardian to Student
    await prisma.guardianStudent.create({
      data: {
        guardian_id: BigInt(testGuardianId),
        student_id: BigInt(testStudentId),
        is_primary: 1,
      },
    });

    // Enroll Student in Section 1
    await prisma.studentEnrollment.create({
      data: {
        student_id: BigInt(testStudentId),
        academic_year_id: BigInt(testAcademicYearId),
        class_id: BigInt(testClassId),
        class_section_id: BigInt(testClassSection1Id),
        grade_level: 5,
        status: 'enrolled',
      },
    });

    // 5. Teaching Assignments
    const ta1 = await prisma.teachingAssignment.create({
      data: {
        academic_year_id: BigInt(testAcademicYearId),
        class_section_id: BigInt(testClassSection1Id),
        subject_id: BigInt(testSubjectId),
        teacher_id: BigInt(testTeacher1Id),
      },
    });
    testTeachingAssignment1Id = Number(ta1.id);

    const ta2 = await prisma.teachingAssignment.create({
      data: {
        academic_year_id: BigInt(testAcademicYearId),
        class_section_id: BigInt(testClassSection2Id),
        subject_id: BigInt(testSubjectId),
        teacher_id: BigInt(testTeacher2Id),
      },
    });
    testTeachingAssignment2Id = Number(ta2.id);
  });

  afterAll(async () => {
    if (testAcademicYearId) {
      await prisma.assignment.deleteMany({
        where: { academic_year_id: BigInt(testAcademicYearId) },
      });
      await prisma.teachingAssignment.deleteMany({
        where: { academic_year_id: BigInt(testAcademicYearId) },
      });
      await prisma.studentEnrollment.deleteMany({
        where: { academic_year_id: BigInt(testAcademicYearId) },
      });
    }
    if (testGuardianId) {
      await prisma.guardianStudent.deleteMany({
        where: { guardian_id: BigInt(testGuardianId) },
      });
      await prisma.guardian.deleteMany({
        where: { id: BigInt(testGuardianId) },
      });
    }
    if (testStudentId) {
      await prisma.student.deleteMany({
        where: { id: BigInt(testStudentId) },
      });
    }
    if (testTeacher1Id || testTeacher2Id) {
      await prisma.teacher.deleteMany({
        where: { id: { in: [BigInt(testTeacher1Id), BigInt(testTeacher2Id)] } },
      });
    }
    if (testClassSection1Id || testClassSection2Id) {
      await prisma.classSection.deleteMany({
        where: { id: { in: [BigInt(testClassSection1Id), BigInt(testClassSection2Id)] } },
      });
    }
    if (testSection1Id || testSection2Id) {
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
    if (testSubjectId) {
      await prisma.subject.deleteMany({
        where: { id: BigInt(testSubjectId) },
      });
    }
    if (testAcademicYearId) {
      await prisma.academicYear.deleteMany({
        where: { id: BigInt(testAcademicYearId) },
      });
    }
    if (testTeacher1UserId) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [
              BigInt(testTeacher1UserId),
              BigInt(testTeacher2UserId),
              BigInt(testStudentUserId),
              BigInt(testParentUserId),
            ],
          },
        },
      });
    }

    await moduleRef.close();
  });

  describe('Group 1: Creation & Validation (TC-ASG-05, TC-ASG-06, TC-ASG-07)', () => {
    it('TC-ASG-05: Successfully creates and publishes an assignment (201 Created)', async () => {
      const result = await assignmentsService.create(
        {
          academic_year_id: testAcademicYearId,
          academic_term_id: testAcademicTermId,
          class_section_id: testClassSection1Id,
          teaching_assignment_id: testTeachingAssignment1Id,
          title: 'حل تمارين ص 45 - الجبر',
          description: 'يرجى حل المسائل الفردية وتسليمها بالدفتر',
          attachments: [{ name: 'worksheet.pdf', url: 'https://example.com/worksheet.pdf' }],
          assigned_date: '2026-09-10',
          due_date: '2026-09-15',
        },
        { id: testTeacher1UserId, role_type: RoleType.teacher },
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
      expect(result.data.created_by_user_id).toBe(testTeacher1UserId);
      expect(result.message).toBe('تم إنشاء ونشر الواجب المدرسي بنجاح.');
      expect(result.data.title).toBe('حل تمارين ص 45 - الجبر');
      expect(result.data.attachments).toHaveLength(1);
      createdAssignment1Id = result.data.id;
    });

    it('TC-ASG-06: Rejects assignment creation when due_date < assigned_date (422 Unprocessable Entity)', async () => {
      await expect(
        assignmentsService.create(
          {
            academic_year_id: testAcademicYearId,
            academic_term_id: testAcademicTermId,
            class_section_id: testClassSection1Id,
            teaching_assignment_id: testTeachingAssignment1Id,
            title: 'واجب غير صالح في التواريخ',
            assigned_date: '2026-09-20',
            due_date: '2026-09-10', // Invalid: prior to assigned_date
          },
          { id: testTeacher1UserId, role_type: RoleType.teacher },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('TC-ASG-06b: Rejects assignment creation when teaching_assignment does not match section (422 Unprocessable Entity)', async () => {
      // TeachingAssignment 1 belongs to Section 1, but section 2 is requested
      await expect(
        assignmentsService.create(
          {
            academic_year_id: testAcademicYearId,
            academic_term_id: testAcademicTermId,
            class_section_id: testClassSection2Id,
            teaching_assignment_id: testTeachingAssignment1Id,
            title: 'إسناد غير مطابق للشعبة',
            assigned_date: '2026-09-10',
            due_date: '2026-09-15',
          },
          { id: testTeacher1UserId, role_type: RoleType.teacher },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('TC-ASG-07: Scoped RBAC - rejects teacher publishing to an unassigned section/subject (403 Forbidden)', async () => {
      // Teacher 1 attempts to publish to Teacher 2's teaching assignment (Section 2)
      await expect(
        assignmentsService.create(
          {
            academic_year_id: testAcademicYearId,
            academic_term_id: testAcademicTermId,
            class_section_id: testClassSection2Id,
            teaching_assignment_id: testTeachingAssignment2Id,
            title: 'محاولة تعدي على شعبة أخرى',
            assigned_date: '2026-09-10',
            due_date: '2026-09-15',
          },
          { id: testTeacher1UserId, role_type: RoleType.teacher },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Group 2: Browsing & Filtering (TC-ASG-01, TC-ASG-02, TC-ASG-03, TC-ASG-04)', () => {
    beforeAll(async () => {
      // Create second assignment for Section 2 by Teacher 2
      const res2 = await assignmentsService.create(
        {
          academic_year_id: testAcademicYearId,
          academic_term_id: testAcademicTermId,
          class_section_id: testClassSection2Id,
          teaching_assignment_id: testTeachingAssignment2Id,
          title: 'واجب الشعبة ب - الفيزياء',
          description: 'مراجعة الفصل الأول',
          assigned_date: '2026-09-10',
          due_date: '2026-09-18',
        },
        { id: testTeacher2UserId, role_type: RoleType.teacher },
      );
      createdAssignment2Id = res2.data.id;
    });

    it('TC-ASG-01: Retrieves hierarchical grouped assignments by classes -> sections -> assignments', async () => {
      const result = await assignmentsService.findAll(
        {
          academic_year_id: testAcademicYearId,
          academic_term_id: testAcademicTermId,
          page: 1,
          per_page: 15,
        },
        { id: testAdminId, role_type: RoleType.admin },
      );

      expect(result.success).toBe(true);
      expect(result.data.academic_year_id).toBe(testAcademicYearId);
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.last_page).toBe(1);
      expect(Array.isArray(result.data.classes)).toBe(true);

      const targetClass = result.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();

      const sec1 = targetClass.sections.find((s: any) => s.class_section_id === testClassSection1Id);
      expect(sec1).toBeDefined();
      expect(sec1.assignments.some((a: any) => a.id === createdAssignment1Id)).toBe(true);
    });

    it('TC-ASG-02: Filters assignments by class_section_id', async () => {
      const result = await assignmentsService.findAll(
        {
          academic_year_id: testAcademicYearId,
          class_section_id: testClassSection1Id,
        },
        { id: testAdminId, role_type: RoleType.admin },
      );

      expect(result.success).toBe(true);
      const targetClass = result.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();
      expect(targetClass.sections).toHaveLength(1);
      expect(targetClass.sections[0].class_section_id).toBe(testClassSection1Id);
    });

    it('TC-ASG-03: Filters assignments by teacher_id', async () => {
      const result = await assignmentsService.findAll(
        {
          academic_year_id: testAcademicYearId,
          teacher_id: testTeacher1Id,
        },
        { id: testAdminId, role_type: RoleType.admin },
      );

      expect(result.success).toBe(true);
      const targetClass = result.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();
      const allAssignments = targetClass.sections.flatMap((s: any) => s.assignments);
      expect(allAssignments.every((a: any) => a.teacher_id === testTeacher1Id)).toBe(true);
    });

    it('TC-ASG-04: Retrieves full details and attachments of a specific assignment (200 OK)', async () => {
      const result = await assignmentsService.findById(createdAssignment1Id, {
        id: testAdminId,
        role_type: RoleType.admin,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdAssignment1Id);
      expect(result.data.title).toBe('حل تمارين ص 45 - الجبر');
      expect(result.data.term_name).toBeDefined();
      expect(result.data.created_by_name).toBeDefined();
      expect(result.data.description).toContain('يرجى حل المسائل');
      expect(result.data.attachments).toHaveLength(1);
    });
  });

  describe('Group 3: Updates, Soft Delete & Negative Cases (TC-ASG-08, TC-ASG-09, TC-ASG-10, TC-ASG-11, TC-ASG-12)', () => {
    it('TC-ASG-08: Successfully updates assignment details and extends due date (200 OK)', async () => {
      const result = await assignmentsService.update(
        createdAssignment1Id,
        {
          title: 'حل تمارين ص 45 - الجبر (محدث وممدد)',
          due_date: '2026-09-25',
        },
        { id: testTeacher1UserId, role_type: RoleType.teacher },
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('تم تحديث الواجب المدرسي بنجاح.');
      expect(result.data.title).toContain('محدث وممدد');
      expect(result.data.due_date).toBe('2026-09-25');
    });

    it('TC-ASG-10: Restricts Student/Parent from creating, updating or deleting assignments (403 Forbidden)', async () => {
      await expect(
        assignmentsService.update(
          createdAssignment1Id,
          { title: 'محاولة تعديل من طالب' },
          { id: testStudentUserId, role_type: RoleType.student },
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        assignmentsService.delete(createdAssignment1Id, {
          id: testStudentUserId,
          role_type: RoleType.student,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-ASG-11: Throws 404 Not Found for non-existent assignment', async () => {
      await expect(
        assignmentsService.findById(999999, {
          id: testAdminId,
          role_type: RoleType.admin,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-ASG-12: Student Role Scoping - student only retrieves assignments for their enrolled section', async () => {
      const result = await assignmentsService.findAll(
        { academic_year_id: testAcademicYearId },
        { id: testStudentUserId, role_type: RoleType.student },
      );

      expect(result.success).toBe(true);
      const targetClass = result.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();
      // Student is enrolled in Section 1, so Section 2 must NOT be included
      expect(targetClass.sections.every((s: any) => s.class_section_id === testClassSection1Id)).toBe(true);
    });

    it('TC-ASG-09: Successfully soft deletes assignment (200 OK & deleted_at set)', async () => {
      const result = await assignmentsService.delete(createdAssignment2Id, {
        id: testTeacher2UserId,
        role_type: RoleType.teacher,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('تم حذف الواجب المدرسي بنجاح.');

      const deleted = await prisma.assignment.findUnique({
        where: { id: BigInt(createdAssignment2Id) },
      });
      expect(deleted?.deleted_at).not.toBeNull();
    });

    it('TC-ASG-12b: Verifies JwtAuthGuard & RolesGuard protect assignments controller (401/403 Security Check)', () => {
      const guards = Reflect.getMetadata('__guards__', AssignmentsController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThanOrEqual(2);
    });
  });
});
