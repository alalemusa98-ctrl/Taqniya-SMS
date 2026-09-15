import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { OfficialExamsService } from './modules/official-exams/official-exams.service.js';
import { OfficialExamsController } from './modules/official-exams/official-exams.controller.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RoleType, ExamType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 08: Official Exams Schedule (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let examsService: OfficialExamsService;
  let examsController: OfficialExamsController;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testTeacherUserId: number;
  let testStudentUserId: number;
  let testParentUserId: number;

  let testAcademicYearId: number;
  let testAcademicTermId: number;
  let testStageId: number;
  let testClassId: number;
  let testSectionId: number;
  let testClassSectionId: number;
  let testSubject1Id: number;
  let testSubject2Id: number;
  let testTeacherId: number;
  let testStudentId: number;

  let createdExam1Id: number;
  let createdExam2Id: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    examsService = moduleRef.get<OfficialExamsService>(OfficialExamsService);
    examsController = moduleRef.get<OfficialExamsController>(OfficialExamsController);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    const hashedPassword = await bcrypt.hash('SecretAdminPass123!', 10);

    // 1. Ensure Admin User
    await prisma.user.upsert({
      where: { id: BigInt(testAdminId) },
      update: { is_active: 1, role_type: RoleType.admin },
      create: {
        id: BigInt(testAdminId),
        user_code: `ADM-EX-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.admin,
        is_active: 1,
      },
    });

    // 2. Create Teacher, Student, Parent users
    const tUser = await prisma.user.create({
      data: {
        user_code: `TCH-EX-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacherUserId = Number(tUser.id);

    const sUser = await prisma.user.create({
      data: {
        user_code: `STU-EX-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.student,
        is_active: 1,
      },
    });
    testStudentUserId = Number(sUser.id);

    const pUser = await prisma.user.create({
      data: {
        user_code: `PAR-EX-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.parent,
        is_active: 1,
      },
    });
    testParentUserId = Number(pUser.id);

    // 3. Create Academic Year and Term
    const year = await prisma.academicYear.create({
      data: {
        name: `2026/2027-EX-${uniqueSuffix}`,
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
          name: `Term1-EX-${uniqueSuffix}`,
          term_number: Math.floor(Math.random() * 80) + 1,
        },
      });
    }
    testAcademicTermId = Number(term.id);

    // 4. Create Stage, Class, Section, ClassSection
    const stage = await prisma.academicStage.create({
      data: {
        name: `Stage-EX-${uniqueSuffix}`,
        order_index: Math.floor(Math.random() * 80) + 1,
      },
    });
    testStageId = Number(stage.id);

    const cls = await prisma.class.create({
      data: {
        stage_id: BigInt(testStageId),
        name: `الصف الخامس EX-${uniqueSuffix}`,
        grade_level: 5,
      },
    });
    testClassId = Number(cls.id);

    const sec = await prisma.section.create({
      data: {
        name: `SectionA-EX-${uniqueSuffix}`,
      },
    });
    testSectionId = Number(sec.id);

    const classSection = await prisma.classSection.create({
      data: {
        class_id: BigInt(cls.id),
        section_id: BigInt(sec.id),
      },
    });
    testClassSectionId = Number(classSection.id);

    // 5. Create Subjects
    const sub1 = await prisma.subject.create({
      data: {
        name: `الرياضيات EX-${uniqueSuffix}`,
        code: `MATH-EX-${uniqueSuffix}`,
      },
    });
    testSubject1Id = Number(sub1.id);

    const sub2 = await prisma.subject.create({
      data: {
        name: `العلوم EX-${uniqueSuffix}`,
        code: `SCI-EX-${uniqueSuffix}`,
      },
    });
    testSubject2Id = Number(sub2.id);

    // 6. Create Teacher Profile & Teaching Assignment
    const teacher = await prisma.teacher.create({
      data: {
        user_id: BigInt(tUser.id),
        full_name: `Teacher EX ${uniqueSuffix}`,
        phone: `0911${uniqueSuffix}`,
        specialization: 'Mathematics',
      },
    });
    testTeacherId = Number(teacher.id);

    await prisma.teachingAssignment.create({
      data: {
        academic_year_id: BigInt(year.id),
        teacher_id: BigInt(teacher.id),
        class_section_id: BigInt(classSection.id),
        subject_id: BigInt(sub1.id),
      },
    });

    // 7. Create Student Profile & Enrollment
    const student = await prisma.student.create({
      data: {
        user_id: BigInt(sUser.id),
        full_name: `Student EX ${uniqueSuffix}`,
        phone: `0944${uniqueSuffix}`,
        birth_date: new Date('2014-05-15'),
        gender: 'male',
      },
    });
    testStudentId = Number(student.id);

    await prisma.studentEnrollment.create({
      data: {
        student_id: BigInt(student.id),
        academic_year_id: BigInt(year.id),
        class_id: BigInt(cls.id),
        class_section_id: BigInt(classSection.id),
        grade_level: 5,
        status: 'enrolled',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    if (testAcademicYearId) {
      await prisma.officialExam.deleteMany({
        where: {
          academic_year_id: BigInt(testAcademicYearId),
        },
      });
      await prisma.teachingAssignment.deleteMany({
        where: { academic_year_id: BigInt(testAcademicYearId) },
      });
      await prisma.studentEnrollment.deleteMany({
        where: { academic_year_id: BigInt(testAcademicYearId) },
      });
    }
    if (testStudentId) {
      await prisma.student.deleteMany({
        where: { id: BigInt(testStudentId) },
      });
    }
    if (testTeacherId) {
      await prisma.teacher.deleteMany({
        where: { id: BigInt(testTeacherId) },
      });
    }
    if (testSubject1Id || testSubject2Id) {
      await prisma.subject.deleteMany({
        where: { id: { in: [BigInt(testSubject1Id), BigInt(testSubject2Id)] } },
      });
    }
    if (testClassSectionId) {
      await prisma.classSection.deleteMany({
        where: { id: BigInt(testClassSectionId) },
      });
    }
    if (testSectionId) {
      await prisma.section.deleteMany({
        where: { id: BigInt(testSectionId) },
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
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            BigInt(testTeacherUserId),
            BigInt(testStudentUserId),
            BigInt(testParentUserId),
          ],
        },
      },
    });
  });

  // ----------------------------------------------------------------------------
  // 1. TC-EXM-05: Create Official Exam (POST /api/v1/official-exams)
  // ----------------------------------------------------------------------------
  it('TC-EXM-05: Should schedule new official exam with attachments and return 201 Created', async () => {
    const res = await examsService.create(
      {
        academic_year_id: testAcademicYearId,
        academic_term_id: testAcademicTermId,
        class_id: testClassId,
        subject_id: testSubject1Id,
        exam_type: ExamType.midterm,
        exam_date: '2026-11-15',
        notes: 'امتحان منتصف الفصل - القاعة الرئيسية أ1',
        attachments: [
          {
            file_name: 'revision_math_grade5.pdf',
            file_url: 'https://cdn.school.edu/exams/revision_math_grade5.pdf',
            file_type: 'application/pdf',
            file_size: 1048576,
          },
        ],
      },
      testAdminId,
      '127.0.0.1',
      'Vitest-Client',
    );

    expect(res.success).toBe(true);
    expect(res.data.id).toBeDefined();
    expect(res.data.class_name).toContain('الصف الخامس');
    expect(res.data.subject_name).toContain('الرياضيات');
    expect(res.data.exam_type).toBe('midterm');
    expect(res.data.exam_type_ar).toBe('امتحان نصفي');
    expect(res.data.attachments_count).toBe(1);
    expect(res.data.attachments[0].file_name).toBe('revision_math_grade5.pdf');

    createdExam1Id = res.data.id;
  });

  // ----------------------------------------------------------------------------
  // 2. TC-EXM-06: Invariant Constraint uq_official_exam_schedule (409 Conflict)
  // ----------------------------------------------------------------------------
  it('TC-EXM-06: Should reject duplicate exam for the same class, subject, term, and type with 409 Conflict', async () => {
    await expect(
      examsService.create(
        {
          academic_year_id: testAcademicYearId,
          academic_term_id: testAcademicTermId,
          class_id: testClassId,
          subject_id: testSubject1Id,
          exam_type: ExamType.midterm, // Same type & subject & class & term
          exam_date: '2026-11-16',
          notes: 'تكرار غير مصرح',
        },
        testAdminId,
      ),
    ).rejects.toThrow(ConflictException);
  });

  // ----------------------------------------------------------------------------
  // 3. Create second exam for tests
  // ----------------------------------------------------------------------------
  it('Should create a second final exam for subject 2', async () => {
    const res = await examsService.create(
      {
        academic_year_id: testAcademicYearId,
        academic_term_id: testAcademicTermId,
        class_id: testClassId,
        subject_id: testSubject2Id,
        exam_type: ExamType.final,
        exam_date: '2027-01-20',
        notes: 'الامتحان النهائي للعلوم - قاعة ب2',
      },
      testAdminId,
    );

    expect(res.success).toBe(true);
    expect(res.data.exam_type).toBe('final');
    createdExam2Id = res.data.id;
  });

  // ----------------------------------------------------------------------------
  // 4. TC-EXM-01: List with filters & hierarchical structure (GET /api/v1/official-exams)
  // ----------------------------------------------------------------------------
  it('TC-EXM-01: Should list official exams with hierarchical classes grouping and pagination meta', async () => {
    const res = await examsService.findAll({
      academic_year_id: testAcademicYearId,
      class_id: testClassId,
      page: 1,
      per_page: 10,
    });

    expect(res.success).toBe(true);
    expect(res.data.classes.length).toBeGreaterThanOrEqual(1);
    expect(res.meta.total).toBeGreaterThanOrEqual(2);
    expect(res.data.items.length).toBeGreaterThanOrEqual(2);

    const classGroup = res.data.classes.find(
      (c: any) => c.class_id === testClassId,
    );
    expect(classGroup).toBeDefined();
    expect(classGroup.exam_types.length).toBeGreaterThanOrEqual(2);
  });

  // ----------------------------------------------------------------------------
  // 5. TC-EXM-02: Search text in subject or notes
  // ----------------------------------------------------------------------------
  it('TC-EXM-02: Should filter exams by search keyword in subject name or notes', async () => {
    const res = await examsService.findAll({
      search: 'رياضيات',
      academic_year_id: testAcademicYearId,
    });

    expect(res.success).toBe(true);
    expect(
      res.data.items.some((i: any) => i.subject_name.includes('الرياضيات')),
    ).toBe(true);
  });

  // ----------------------------------------------------------------------------
  // 6. TC-EXM-03: Get exam details by ID with attachments (GET /api/v1/official-exams/:id)
  // ----------------------------------------------------------------------------
  it('TC-EXM-03: Should fetch exam details by ID with attachments and Arabic day name', async () => {
    const res = await examsService.findById(createdExam1Id);

    expect(res.success).toBe(true);
    expect(res.data.id).toBe(createdExam1Id);
    expect(res.data.subject_id).toBe(testSubject1Id);
    expect(res.data.exam_day_name).toBeDefined();
    expect(res.data.attachments_count).toBe(1);
    expect(res.data.attachments[0].file_name).toBe('revision_math_grade5.pdf');
  });

  // ----------------------------------------------------------------------------
  // 7. TC-EXM-04: Get Class Exam Timetable (GET /api/v1/classes/:class_id/official-exams)
  // ----------------------------------------------------------------------------
  it('TC-EXM-04: Should fetch class official exam schedule grouped by exam type for students/parents', async () => {
    const res = await examsService.findByClass(
      testClassId,
      testAcademicTermId,
    );

    expect(res.success).toBe(true);
    expect(res.data.class_id).toBe(testClassId);
    expect(res.data.exam_types.length).toBeGreaterThanOrEqual(2);

    const midtermGroup = res.data.exam_types.find(
      (g: any) => g.exam_type === 'midterm',
    );
    expect(midtermGroup).toBeDefined();
    expect(midtermGroup.exams.length).toBeGreaterThanOrEqual(1);
    expect(midtermGroup.exams[0].subject_id).toBe(testSubject1Id);
  });

  // ----------------------------------------------------------------------------
  // 8. TC-EXM-04B: Get Teacher Assigned Subjects Exams (GET /api/v1/teachers/:teacher_id/official-exams)
  // ----------------------------------------------------------------------------
  it('TC-EXM-04B: Should fetch teacher assigned subjects official exams schedule', async () => {
    const res = await examsService.findByTeacher(
      testTeacherId,
      testAcademicTermId,
      { id: testTeacherUserId, role_type: RoleType.teacher },
    );

    expect(res.success).toBe(true);
    expect(res.data.teacher_id).toBe(testTeacherId);
    expect(res.data.exams.length).toBeGreaterThanOrEqual(1);
    expect(res.data.exams[0].subject_id).toBe(testSubject1Id);
  });

  // ----------------------------------------------------------------------------
  // 9. TC-EXM-07: Validation / Not Found for invalid relations
  // ----------------------------------------------------------------------------
  it('TC-EXM-07: Should reject creation with non-existent subject or class with NotFoundException', async () => {
    await expect(
      examsService.create(
        {
          academic_year_id: testAcademicYearId,
          academic_term_id: testAcademicTermId,
          class_id: 999999,
          subject_id: testSubject1Id,
          exam_type: ExamType.final,
          exam_date: '2027-01-25',
        },
        testAdminId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // ----------------------------------------------------------------------------
  // 10. TC-EXM-08: Update Exam Schedule & Attachments (PUT /api/v1/official-exams/:id)
  // ----------------------------------------------------------------------------
  it('TC-EXM-08: Should update exam date, notes, and attachments successfully', async () => {
    const res = await examsService.update(
      createdExam1Id,
      {
        exam_date: '2026-11-20',
        notes: 'تم تأجيل الموعد إلى 20 نوفمبر - القاعة الكبرى',
        attachments: [
          {
            file_name: 'updated_revision.pdf',
            file_url: 'https://cdn.school.edu/exams/updated_revision.pdf',
            file_type: 'application/pdf',
            file_size: 2048000,
          },
        ],
      },
      testAdminId,
      '127.0.0.1',
      'Vitest-Client',
    );

    expect(res.success).toBe(true);
    expect(res.data.exam_date).toBe('2026-11-20');
    expect(res.data.notes).toContain('تم تأجيل الموعد');
    expect(res.data.attachments[0].file_name).toBe('updated_revision.pdf');
  });

  // ----------------------------------------------------------------------------
  // 11. TC-AUDIT-01: Audit Log Verification
  // ----------------------------------------------------------------------------
  it('TC-AUDIT-01: Should create audit log records for create, update, and delete actions', async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity_type: 'OfficialExam',
        entity_id: BigInt(createdExam1Id),
      },
    });

    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.some((l) => l.action === 'create')).toBe(true);
    expect(logs.some((l) => l.action === 'update')).toBe(true);
  });

  // ----------------------------------------------------------------------------
  // 12. TC-EXM-09: Soft Delete Exam (DELETE /api/v1/official-exams/:id)
  // ----------------------------------------------------------------------------
  it('TC-EXM-09: Should soft delete official exam and exclude from active listings', async () => {
    const res = await examsService.delete(
      createdExam2Id,
      testAdminId,
      '127.0.0.1',
      'Vitest-Client',
    );

    expect(res.success).toBe(true);
    expect(res.message).toContain('تم إلغاء وحذف الامتحان الرسمي');

    // Verification: fetching deleted exam throws NotFoundException
    await expect(examsService.findById(createdExam2Id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
