import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import { ClassAcademicTermsService } from './modules/academic/class-academic-terms/class-academic-terms.service.js';
import { ClassSectionsService } from './modules/academic/class-sections/class-sections.service.js';
import { ClassSubjectsService } from './modules/academic/class-subjects/class-subjects.service.js';
import { ClassesService } from './modules/academic/classes/classes.service.js';
import { SectionsService } from './modules/academic/sections/sections.service.js';
import { SubjectsService } from './modules/academic/subjects/subjects.service.js';
import { StagesService } from './modules/academic/stages/stages.service.js';
import { TermsService } from './modules/academic/terms/terms.service.js';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

describe('Phase 02-C: Class Terms, Sections & Curriculum (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let classAcademicTermsService: ClassAcademicTermsService;
  let classSectionsService: ClassSectionsService;
  let classSubjectsService: ClassSubjectsService;
  let classesService: ClassesService;
  let sectionsService: SectionsService;
  let subjectsService: SubjectsService;
  let stagesService: StagesService;
  let termsService: TermsService;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testStageId: number;
  let testClassId: number;
  let testTermId1: number;
  let testTermId2: number;
  let testSectionId1: number;
  let testSectionId2: number;
  let testSubjectId1: number;
  let testSubjectId2: number;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    classAcademicTermsService = moduleRef.get<ClassAcademicTermsService>(ClassAcademicTermsService);
    classSectionsService = moduleRef.get<ClassSectionsService>(ClassSectionsService);
    classSubjectsService = moduleRef.get<ClassSubjectsService>(ClassSubjectsService);
    classesService = moduleRef.get<ClassesService>(ClassesService);
    sectionsService = moduleRef.get<SectionsService>(SectionsService);
    subjectsService = moduleRef.get<SubjectsService>(SubjectsService);
    stagesService = moduleRef.get<StagesService>(StagesService);
    termsService = moduleRef.get<TermsService>(TermsService);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    // Seed required predecessor entities for Phase 02-C testing
    const stageRes = await stagesService.create(
      {
        name: `Stage-Phase02C-${Date.now()}`,
        order_index: Math.floor(Math.random() * 50) + 1,
      },
      testAdminId,
    );
    testStageId = stageRes.data.id;

    const classRes = await classesService.create(
      {
        stage_id: stageRes.data.id,
        name: `Class-02C-${Date.now()}`,
        grade_level: Math.floor(Math.random() * 12) + 1,
      },
      testAdminId,
    );
    testClassId = classRes.data.id;

    const termRes1 = await termsService.create(
      {
        name: `Term1-02C-${Date.now()}`,
        term_number: Math.floor(Math.random() * 40) + 10,
      },
      testAdminId,
    );
    testTermId1 = termRes1.data.id;

    const termRes2 = await termsService.create(
      {
        name: `Term2-02C-${Date.now()}`,
        term_number: Math.floor(Math.random() * 40) + 60,
      },
      testAdminId,
    );
    testTermId2 = termRes2.data.id;

    const sectionRes1 = await sectionsService.create(
      {
        name: `Sec1-02C-${Date.now()}`,
      },
      testAdminId,
    );
    testSectionId1 = sectionRes1.data.id;

    const sectionRes2 = await sectionsService.create(
      {
        name: `Sec2-02C-${Date.now()}`,
      },
      testAdminId,
    );
    testSectionId2 = sectionRes2.data.id;

    const subjectRes1 = await subjectsService.create(
      {
        name: `Sub1-02C-${Date.now()}`,
        code: `C1_${Date.now()}`.slice(0, 20),
      },
      testAdminId,
    );
    testSubjectId1 = subjectRes1.data.id;

    const subjectRes2 = await subjectsService.create(
      {
        name: `Sub2-02C-${Date.now()}`,
        code: `C2_${Date.now()}`.slice(0, 20),
      },
      testAdminId,
    );
    testSubjectId2 = subjectRes2.data.id;
  });

  afterAll(async () => {
    // Clean up test entities so they do not pollute the database
    try {
      if (testClassId) {
        await prisma.classSubject.deleteMany({ where: { class_id: BigInt(testClassId) } });
        await prisma.classSection.deleteMany({ where: { class_id: BigInt(testClassId) } });
        await prisma.classAcademicTerm.deleteMany({ where: { class_id: BigInt(testClassId) } });
        await prisma.class.deleteMany({ where: { id: BigInt(testClassId) } });
      }
      if (testSubjectId1 || testSubjectId2) {
        const subIds = [testSubjectId1, testSubjectId2].filter(Boolean).map(BigInt);
        await prisma.classSubject.deleteMany({ where: { subject_id: { in: subIds } } });
        await prisma.subject.deleteMany({ where: { id: { in: subIds } } });
      }
      if (testSectionId1 || testSectionId2) {
        const secIds = [testSectionId1, testSectionId2].filter(Boolean).map(BigInt);
        await prisma.classSection.deleteMany({ where: { section_id: { in: secIds } } });
        await prisma.section.deleteMany({ where: { id: { in: secIds } } });
      }
      if (testTermId1 || testTermId2) {
        const termIds = [testTermId1, testTermId2].filter(Boolean).map(BigInt);
        await prisma.classAcademicTerm.deleteMany({ where: { academic_term_id: { in: termIds } } });
        await prisma.academicTerm.deleteMany({ where: { id: { in: termIds } } });
      }
      if (testStageId) {
        await prisma.academicStage.deleteMany({ where: { id: BigInt(testStageId) } });
      }
    } catch (cleanupErr) {
      console.error('Teardown cleanup error:', cleanupErr);
    }

    await prisma.$disconnect();
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // Step 1: Class Academic Terms (class_academic_terms)
  // ---------------------------------------------------------------------------
  describe('Step 1: Class Academic Terms (class_academic_terms)', () => {
    let createdClassTermId1: number;
    let createdClassTermId2: number;

    it('TC-CAT-01: Create/assign a term to a class successfully', async () => {
      const res = await classAcademicTermsService.create(
        {
          class_id: testClassId,
          academic_term_id: testTermId1,
        },
        testAdminId,
      );

      expect(res.success).toBe(true);
      expect(res.data.id).toBeDefined();
      expect(res.data.class_id).toBe(testClassId);
      expect(res.data.academic_term_id).toBe(testTermId1);
      expect(res.data.is_active).toBe(0);
      expect(res.data.is_closed).toBe(0);
      createdClassTermId1 = res.data.id;
    });

    it('TC-CAT-02: Prevent duplicate term assignment to the same class (uq_class_term)', async () => {
      await expect(
        classAcademicTermsService.create(
          {
            class_id: testClassId,
            academic_term_id: testTermId1,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-CAT-03: Create a second term for the class', async () => {
      const res = await classAcademicTermsService.create(
        {
          class_id: testClassId,
          academic_term_id: testTermId2,
        },
        testAdminId,
      );

      expect(res.success).toBe(true);
      expect(res.data.id).toBeDefined();
      createdClassTermId2 = res.data.id;
    });

    it('TC-CAT-04: Atomic activation of single active term per class', async () => {
      // Activate term 1
      const act1 = await classAcademicTermsService.activate(createdClassTermId1, testAdminId);
      expect(act1.success).toBe(true);
      expect(act1.data.is_active).toBe(1);

      // Now activate term 2 -> term 1 should be atomically deactivated
      const act2 = await classAcademicTermsService.activate(createdClassTermId2, testAdminId);
      expect(act2.success).toBe(true);
      expect(act2.data.is_active).toBe(1);

      // Verify term 1 is now inactive
      const t1 = await classAcademicTermsService.findOne(createdClassTermId1);
      expect(t1.data.is_active).toBe(0);
    });

    it('TC-CAT-05: Toggle/close term marks for archiving', async () => {
      const closeRes = await classAcademicTermsService.close(createdClassTermId1, testAdminId);
      expect(closeRes.success).toBe(true);
      expect(closeRes.data.is_closed).toBe(1);

      // Verify lock: update should fail on a closed term
      await expect(
        classAcademicTermsService.update(
          createdClassTermId1,
          { academic_term_id: testTermId1 },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);

      // Re-open term
      const reopenRes = await classAcademicTermsService.close(createdClassTermId1, testAdminId);
      expect(reopenRes.success).toBe(true);
      expect(reopenRes.data.is_closed).toBe(0);
    });

    it('TC-CAT-06: Query class academic terms with hierarchical grouping & pagination', async () => {
      const res = await classAcademicTermsService.findAll({
        class_id: testClassId,
        page: 1,
        per_page: 15,
      });

      expect(res.success).toBe(true);
      expect(res.data.classes).toBeDefined();
      expect(res.data.classes.length).toBeGreaterThanOrEqual(1);
      const targetClass = res.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();
      expect(targetClass.terms.length).toBe(2);
      expect(res.meta).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Step 2: Class Sections (class_sections)
  // ---------------------------------------------------------------------------
  describe('Step 2: Class Sections (class_sections)', () => {
    let createdClassSectionId1: number;

    it('TC-CSE-01: Assign/open a section for a class successfully', async () => {
      const res = await classSectionsService.create(
        {
          class_id: testClassId,
          section_id: testSectionId1,
        },
        testAdminId,
      );

      expect(res.success).toBe(true);
      expect(res.data.id).toBeDefined();
      expect(res.data.class_id).toBe(testClassId);
      expect(res.data.section_id).toBe(testSectionId1);
      createdClassSectionId1 = res.data.id;
    });

    it('TC-CSE-02: Prevent duplicate section assignment to the same class (uq_class_sections)', async () => {
      await expect(
        classSectionsService.create(
          {
            class_id: testClassId,
            section_id: testSectionId1,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-CSE-03: Assign a second section to the class', async () => {
      const res = await classSectionsService.create(
        {
          class_id: testClassId,
          section_id: testSectionId2,
        },
        testAdminId,
      );

      expect(res.success).toBe(true);
      expect(res.data.id).toBeDefined();
    });

    it('TC-CSE-04: Query class sections with hierarchy & counts', async () => {
      const res = await classSectionsService.findAll({
        class_id: testClassId,
        page: 1,
        per_page: 15,
      });

      expect(res.success).toBe(true);
      expect(res.data.classes).toBeDefined();
      const targetClass = res.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();
      expect(targetClass.sections_count).toBeGreaterThanOrEqual(2);
      expect(targetClass.sections.length).toBeGreaterThanOrEqual(2);
    });

    it('TC-CSE-05: Remove/unassign section from class (Soft Delete)', async () => {
      const res = await classSectionsService.remove(createdClassSectionId1, testAdminId);
      expect(res.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Step 3: Class Subjects & Score Distribution (class_subjects)
  // ---------------------------------------------------------------------------
  describe('Step 3: Class Subjects (class_subjects)', () => {
    let testClassAcademicTermId: number;
    let createdClassSubjectId1: number;

    beforeAll(async () => {
      // Fetch or create an active class academic term for this step
      const termsRes = await classAcademicTermsService.findAll({ class_id: testClassId });
      testClassAcademicTermId = termsRes.data.classes[0].terms[0].id;
    });

    it('TC-CSU-01: Assign a subject to a class term with score configuration', async () => {
      const res = await classSubjectsService.create(
        {
          class_academic_term_id: testClassAcademicTermId,
          subject_id: testSubjectId1,
          passing_score: 50.0,
          max_score: 100.0,
        },
        testAdminId,
      );

      expect(res.success).toBe(true);
      expect(res.data.id).toBeDefined();
      expect(res.data.class_id).toBe(testClassId);
      expect(res.data.subject_id).toBe(testSubjectId1);
      expect(Number(res.data.passing_score)).toBe(50);
      expect(Number(res.data.max_score)).toBe(100);
      createdClassSubjectId1 = res.data.id;
    });

    it('TC-CSU-02: Prevent duplicate subject assignment to the same term (uq_class_term_subject)', async () => {
      await expect(
        classSubjectsService.create(
          {
            class_academic_term_id: testClassAcademicTermId,
            subject_id: testSubjectId1,
            passing_score: 50.0,
            max_score: 100.0,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-CSU-03: Reject score validation if passing_score > max_score', async () => {
      await expect(
        classSubjectsService.create(
          {
            class_academic_term_id: testClassAcademicTermId,
            subject_id: testSubjectId2,
            passing_score: 110.0,
            max_score: 100.0,
          },
          testAdminId,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('TC-CSU-04: Update subject scores for an open term', async () => {
      const res = await classSubjectsService.update(
        createdClassSubjectId1,
        {
          class_academic_term_id: testClassAcademicTermId,
          subject_id: testSubjectId1,
          passing_score: 60.0,
          max_score: 100.0,
        },
        testAdminId,
      );

      expect(res.success).toBe(true);
      expect(Number(res.data.passing_score)).toBe(60);
    });

    it('TC-CSU-05: Reject subject score update if term is closed (Lock)', async () => {
      // Close the term
      await classAcademicTermsService.close(testClassAcademicTermId, testAdminId);

      await expect(
        classSubjectsService.update(
          createdClassSubjectId1,
          {
            class_academic_term_id: testClassAcademicTermId,
            subject_id: testSubjectId1,
            passing_score: 70.0,
            max_score: 100.0,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);

      // Re-open term
      await classAcademicTermsService.close(testClassAcademicTermId, testAdminId);
    });

    it('TC-CSU-06: Query curriculum structure grouped by class and term', async () => {
      const res = await classSubjectsService.findAll({
        class_id: testClassId,
        page: 1,
        per_page: 15,
      });

      expect(res.success).toBe(true);
      expect(res.data.classes).toBeDefined();
      const targetClass = res.data.classes.find((c: any) => c.class_id === testClassId);
      expect(targetClass).toBeDefined();
      expect(targetClass.terms.length).toBeGreaterThanOrEqual(1);
      const targetTerm = targetClass.terms.find(
        (t: any) => t.class_academic_term_id === testClassAcademicTermId,
      );
      expect(targetTerm).toBeDefined();
      expect(targetTerm.subjects.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-CSU-07: Remove/unassign subject from term curriculum (Soft Delete)', async () => {
      const res = await classSubjectsService.remove(createdClassSubjectId1, testAdminId);
      expect(res.success).toBe(true);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });
});
