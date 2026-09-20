import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { QuizzesService } from './modules/quizzes/quizzes.service.js';
import { QuizzesController } from './modules/quizzes/quizzes.controller.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 07: Quizzes & Monthly Tests (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let quizzesService: QuizzesService;
  let quizzesController: QuizzesController;
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

  let createdQuiz1Id: number;
  let createdQuiz2Id: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    quizzesService = moduleRef.get<QuizzesService>(QuizzesService);
    quizzesController = moduleRef.get<QuizzesController>(QuizzesController);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    const hashedPassword = await bcrypt.hash('SecretAdminPass123!', 10);

    // 1. Ensure Admin User
    await prisma.user.upsert({
      where: { id: BigInt(testAdminId) },
      update: { is_active: 1, role_type: RoleType.admin },
      create: {
        id: BigInt(testAdminId),
        user_code: `ADM-QZ-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.admin,
        is_active: 1,
      },
    });

    // 2. Create Teachers, Student, Parent users
    const tUser1 = await prisma.user.create({
      data: {
        user_code: `TCH1-QZ-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacher1UserId = Number(tUser1.id);

    const tUser2 = await prisma.user.create({
      data: {
        user_code: `TCH2-QZ-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacher2UserId = Number(tUser2.id);

    const sUser = await prisma.user.create({
      data: {
        user_code: `STU-QZ-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.student,
        is_active: 1,
      },
    });
    testStudentUserId = Number(sUser.id);

    const pUser = await prisma.user.create({
      data: {
        user_code: `PAR-QZ-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.parent,
        is_active: 1,
      },
    });
    testParentUserId = Number(pUser.id);

    // 3. Academic Structure
    const year = await prisma.academicYear.create({
      data: {
        name: `Year-QZ-${uniqueSuffix}`,
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
          name: `Term1-QZ-${uniqueSuffix}`,
          term_number: Math.floor(Math.random() * 80) + 1,
        },
      });
    }
    testAcademicTermId = Number(term.id);

    const stage = await prisma.academicStage.create({
      data: {
        name: `Stage-QZ-${uniqueSuffix}`,
        order_index: Math.floor(Math.random() * 80) + 1,
      },
    });
    testStageId = Number(stage.id);

    const cls = await prisma.class.create({
      data: {
        stage_id: BigInt(testStageId),
        name: `Grade5-QZ-${uniqueSuffix}`,
        grade_level: 5,
      },
    });
    testClassId = Number(cls.id);

    const sec1 = await prisma.section.create({
      data: { name: `SectionA-QZ-${uniqueSuffix}` },
    });
    testSection1Id = Number(sec1.id);

    const sec2 = await prisma.section.create({
      data: { name: `SectionB-QZ-${uniqueSuffix}` },
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
        name: `Math-QZ-${uniqueSuffix}`,
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
        full_name: `Student QZ ${uniqueSuffix}`,
        phone: `0944${uniqueSuffix}`,
        birth_date: new Date('2014-05-15'),
        gender: 'male',
      },
    });
    testStudentId = Number(stu.id);

    const grd = await prisma.guardian.create({
      data: {
        user_id: BigInt(testParentUserId),
        full_name: `Guardian QZ ${uniqueSuffix}`,
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
      await prisma.quiz.deleteMany({
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
    if (testTeacher1Id) {
      await prisma.teacher.deleteMany({
        where: { id: { in: [BigInt(testTeacher1Id), BigInt(testTeacher2Id)] } },
      });
    }
    if (testSubjectId) {
      await prisma.subject.deleteMany({
        where: { id: BigInt(testSubjectId) },
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

    if (moduleRef) {
      await moduleRef.close();
    }
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-05: Create Quiz Successfully
  // ----------------------------------------------------------------------------
  it('TC-QZ-05: [Unit/Validation] should create and schedule quiz successfully', async () => {
    const futureDate = '2026-10-15';
    const payload = {
      academic_year_id: testAcademicYearId,
      academic_term_id: testAcademicTermId,
      class_section_id: testClassSection1Id,
      teaching_assignment_id: testTeachingAssignment1Id,
      title: 'تطبيق شهري 1 - الجبر والمعادلات',
      description: 'مراجعة من ص 10 إلى ص 35',
      attachments: [
        {
          file_name: 'algebra_review.pdf',
          file_url: 'https://storage.taqniya.ly/quizzes/algebra_review.pdf',
          file_type: 'application/pdf',
          file_size: 1048576,
        },
      ],
      quiz_date: futureDate,
    };

    const teacher1User = { id: testTeacher1UserId, role_type: RoleType.teacher };
    const res = await quizzesService.create(payload, teacher1User);

    expect(res.success).toBe(true);
    expect(res.message).toBe('تم جدولة ونشر الاختبار الدوري بنجاح.');
    expect(res.data.id).toBeDefined();
    expect(res.data.title).toBe(payload.title);
    expect(res.data.quiz_date).toBe(futureDate);
    expect(res.data.attachments).toHaveLength(1);

    createdQuiz1Id = res.data.id;

    // Create a second quiz in Section 2 by Teacher 2
    const res2 = await quizzesService.create(
      {
        academic_year_id: testAcademicYearId,
        academic_term_id: testAcademicTermId,
        class_section_id: testClassSection2Id,
        teaching_assignment_id: testTeachingAssignment2Id,
        title: 'تطبيق شهري 1 - الهندسة والزوايا',
        description: 'مراجعة نظريات المثلث',
        attachments: [],
        quiz_date: '2026-10-20',
      },
      { id: testTeacher2UserId, role_type: RoleType.teacher },
    );
    createdQuiz2Id = res2.data.id;
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-06: Validation Error on Invalid Date
  // ----------------------------------------------------------------------------
  it('TC-QZ-06: [Validation] should fail validation on invalid quiz date', async () => {
    const invalidPayload = {
      academic_year_id: testAcademicYearId,
      academic_term_id: testAcademicTermId,
      class_section_id: testClassSection1Id,
      teaching_assignment_id: testTeachingAssignment1Id,
      title: 'تطبيق غير صالح',
      quiz_date: 'not-a-valid-date',
    };

    const teacher1User = { id: testTeacher1UserId, role_type: RoleType.teacher };

    await expect(quizzesService.create(invalidPayload, teacher1User)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-07: Scoped RBAC Violation (Teacher scheduling for unassigned section)
  // ----------------------------------------------------------------------------
  it('TC-QZ-07: [Security/RBAC] should block teacher from scheduling quiz for an unassigned section', async () => {
    // Teacher 1 attempts to create quiz using Teacher 2's teaching assignment (Section 2)
    const payload = {
      academic_year_id: testAcademicYearId,
      academic_term_id: testAcademicTermId,
      class_section_id: testClassSection2Id,
      teaching_assignment_id: testTeachingAssignment2Id,
      title: 'محاولة اختراق الصلاحيات',
      quiz_date: '2026-10-25',
    };

    const teacher1User = { id: testTeacher1UserId, role_type: RoleType.teacher };

    await expect(quizzesService.create(payload, teacher1User)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-01: Hierarchical List with Class Filter & Upcoming Status
  // ----------------------------------------------------------------------------
  it('TC-QZ-01: [Integration] should retrieve hierarchical quizzes matrix filtered by class and upcoming status', async () => {
    const adminUser = { id: testAdminId, role_type: RoleType.admin };
    const query = {
      academic_year_id: testAcademicYearId,
      academic_term_id: testAcademicTermId,
      class_id: testClassId,
      page: 1,
      per_page: 15,
    };

    const res = await quizzesService.findAll(query, adminUser);

    expect(res.success).toBe(true);
    expect(res.message).toBe('تم جلب مصفوفة الاختبارات والتطبيقات الدورية بنجاح.');
    expect(res.data.classes).toBeDefined();
    expect(res.data.classes.length).toBeGreaterThan(0);

    const targetClass = res.data.classes.find((c: any) => c.class_id === testClassId);
    expect(targetClass).toBeDefined();
    expect(targetClass.sections).toBeDefined();
    expect(targetClass.sections.length).toBeGreaterThanOrEqual(2);

    expect(res.meta.total).toBeGreaterThanOrEqual(2);
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-02: Filter List by Class Section
  // ----------------------------------------------------------------------------
  it('TC-QZ-02: [Integration] should retrieve quizzes filtered by specific class section', async () => {
    const adminUser = { id: testAdminId, role_type: RoleType.admin };
    const query = {
      academic_year_id: testAcademicYearId,
      class_section_id: testClassSection1Id,
      page: 1,
    };

    const res = await quizzesService.findAll(query, adminUser);

    expect(res.success).toBe(true);
    expect(res.data.classes).toHaveLength(1);
    expect(res.data.classes[0].sections).toHaveLength(1);
    expect(res.data.classes[0].sections[0].class_section_id).toBe(testClassSection1Id);
    expect(res.data.classes[0].sections[0].quizzes[0].id).toBe(createdQuiz1Id);
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-03: Filter List by Teacher
  // ----------------------------------------------------------------------------
  it('TC-QZ-03: [Integration] should retrieve quizzes filtered by specific teacher', async () => {
    const adminUser = { id: testAdminId, role_type: RoleType.admin };
    const query = {
      academic_year_id: testAcademicYearId,
      teacher_id: testTeacher1Id,
      page: 1,
    };

    const res = await quizzesService.findAll(query, adminUser);

    expect(res.success).toBe(true);
    expect(res.meta.total).toBe(1);
    expect(res.data.classes[0].sections[0].quizzes[0].teacher_name).toContain(`Teacher 1 ${uniqueSuffix}`);
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-04: Single Quiz Details
  // ----------------------------------------------------------------------------
  it('TC-QZ-04: [Integration] should retrieve full details and attachments of a specific quiz', async () => {
    const studentUser = { id: testStudentUserId, role_type: RoleType.student };
    const res = await quizzesService.findById(createdQuiz1Id, studentUser);

    expect(res.success).toBe(true);
    expect(res.message).toBe('تم جلب تفاصيل الاختبار الدوري بنجاح.');
    expect(res.data.id).toBe(createdQuiz1Id);
    expect(res.data.title).toBe('تطبيق شهري 1 - الجبر والمعادلات');
    expect(res.data.subject_name).toContain('Math-QZ');
    expect(res.data.teacher_name).toContain(`Teacher 1 ${uniqueSuffix}`);
    expect(res.data.created_by_name).toContain(`Teacher 1 ${uniqueSuffix}`);
    expect(res.data.attachments).toHaveLength(1);
    expect(res.data.attachments[0].file_name).toBe('algebra_review.pdf');
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-08: Update Quiz Successfully
  // ----------------------------------------------------------------------------
  it('TC-QZ-08: [Integration] should update quiz details and postpone date successfully', async () => {
    const updatedDate = '2026-10-22';
    const updatePayload = {
      title: 'تطبيق شهري 1 - الجبر والمعادلات (موعد معدل)',
      description: 'تم تمديد المقرر ليشمل حل المعادلات التربيعية',
      quiz_date: updatedDate,
    };

    const teacher1User = { id: testTeacher1UserId, role_type: RoleType.teacher };
    const res = await quizzesService.update(createdQuiz1Id, updatePayload, teacher1User);

    expect(res.success).toBe(true);
    expect(res.message).toBe('تم تحديث موعد وتفاصيل الاختبار الدوري بنجاح.');
    expect(res.data.title).toBe(updatePayload.title);
    expect(res.data.quiz_date).toBe(updatedDate);

    // Verify persisted in DB
    const fetched = await quizzesService.findById(createdQuiz1Id, teacher1User);
    expect(fetched.data.title).toBe(updatePayload.title);
    expect(fetched.data.quiz_date).toBe(updatedDate);
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-10: Scoped RBAC Violation (Student/Parent attempting to update/delete)
  // ----------------------------------------------------------------------------
  it('TC-QZ-10: [Security/RBAC] should block students and parents from modifying or deleting quizzes', async () => {
    const studentUser = { id: testStudentUserId, role_type: RoleType.student };
    const parentUser = { id: testParentUserId, role_type: RoleType.parent };

    await expect(
      quizzesService.update(createdQuiz1Id, { title: 'محاولة تعديل من طالب' }, studentUser),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      quizzesService.delete(createdQuiz1Id, studentUser),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      quizzesService.delete(createdQuiz1Id, parentUser),
    ).rejects.toThrow(ForbiddenException);
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-09: Soft Delete Quiz
  // ----------------------------------------------------------------------------
  it('TC-QZ-09: [Integration] should soft delete quiz and set deleted_at', async () => {
    const teacher1User = { id: testTeacher1UserId, role_type: RoleType.teacher };
    const res = await quizzesService.delete(createdQuiz1Id, teacher1User);

    expect(res.success).toBe(true);
    expect(res.message).toBe('تم حذف الاختبار الدوري بنجاح.');

    // Direct DB inspection for soft delete
    const dbRecord = await prisma.quiz.findUnique({
      where: { id: BigInt(createdQuiz1Id) },
    });
    expect(dbRecord?.deleted_at).not.toBeNull();
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-11: Negative Case (404 for deleted or non-existent quiz)
  // ----------------------------------------------------------------------------
  it('TC-QZ-11: [Negative] should return 404 for deleted or non-existent quiz', async () => {
    const adminUser = { id: testAdminId, role_type: RoleType.admin };

    // Already soft deleted
    await expect(quizzesService.findById(createdQuiz1Id, adminUser)).rejects.toThrow(
      NotFoundException,
    );

    // Non-existent ID
    await expect(quizzesService.findById(999999, adminUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  // ----------------------------------------------------------------------------
  // TC-QZ-12: Controller Route Mapping & Security Verification
  // ----------------------------------------------------------------------------
  it('TC-QZ-12: [Controller] should correctly map controller routes and execute operations', async () => {
    const adminUser = { id: testAdminId, role_type: RoleType.admin };

    // Check Controller findAll
    const listRes = await quizzesController.findAll(
      { academic_year_id: testAcademicYearId, page: 1 },
      adminUser,
    );
    expect(listRes.success).toBe(true);

    // Check Controller findById for Quiz 2
    const detailRes = await quizzesController.findById(createdQuiz2Id, adminUser);
    expect(detailRes.success).toBe(true);
    expect(detailRes.data.id).toBe(createdQuiz2Id);
  });
});
