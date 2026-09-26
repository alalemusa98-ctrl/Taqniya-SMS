import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import { ClassesService } from './modules/academic/classes/classes.service.js';
import { SectionsService } from './modules/academic/sections/sections.service.js';
import { SubjectsService } from './modules/academic/subjects/subjects.service.js';
import { StagesService } from './modules/academic/stages/stages.service.js';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

describe('Phase 02-B: Classes, Sections & Subjects (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let classesService: ClassesService;
  let sectionsService: SectionsService;
  let subjectsService: SubjectsService;
  let stagesService: StagesService;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testStageId: number;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    classesService = moduleRef.get<ClassesService>(ClassesService);
    sectionsService = moduleRef.get<SectionsService>(SectionsService);
    subjectsService = moduleRef.get<SubjectsService>(SubjectsService);
    stagesService = moduleRef.get<StagesService>(StagesService);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    // Create a base academic stage for classes testing
    const stageRes = await stagesService.create(
      {
        name: `Stage-Phase02B-${Date.now()}`,
        order_index: Math.floor(Math.random() * 50) + 1,
      },
      testAdminId,
    );
    testStageId = stageRes.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // Step 1: Classes (classes)
  // ---------------------------------------------------------------------------
  describe('Step 1: Academic Classes (classes)', () => {
    let createdClassId: number;
    const testGradeLevel = Math.floor(Math.random() * 10) + 1;

    it('TC-CLS-01: Create a class successfully within a stage', async () => {
      const className = `Class-${Date.now()}`;
      const result = await classesService.create(
        {
          stage_id: testStageId,
          name: className,
          grade_level: testGradeLevel,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(className);
      expect(result.data.stage_id).toBe(testStageId);
      expect(result.data.grade_level).toBe(testGradeLevel);
      expect(result.data.max_second_round_subjects).toBe(3);
      createdClassId = result.data.id;
    });

    it('TC-CLS-02: Fail on duplicate grade_level in same stage (409 Conflict)', async () => {
      await expect(
        classesService.create(
          {
            stage_id: testStageId,
            name: `DuplicateLevelClass-${Date.now()}`,
            grade_level: testGradeLevel,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-CLS-03: Fail when grade_level is out of range (422)', async () => {
      await expect(
        classesService.create(
          {
            stage_id: testStageId,
            name: `InvalidGradeClass-${Date.now()}`,
            grade_level: 15,
          },
          testAdminId,
        ),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        classesService.create(
          {
            stage_id: testStageId,
            name: `InvalidGradeZero-${Date.now()}`,
            grade_level: 0,
          },
          testAdminId,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('TC-CLS-04: Fail when stage does not exist (422/404)', async () => {
      await expect(
        classesService.create(
          {
            stage_id: 999999,
            name: `NonExistingStageClass-${Date.now()}`,
            grade_level: 1,
          },
          testAdminId,
        ),
      ).rejects.toThrow();
    });

    it('TC-CLS-05: Retrieve classes list with search and stage filter', async () => {
      const result = await classesService.findAll({
        stage_id: testStageId,
        page: 1,
        per_page: 10,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.meta).toBeDefined();
    });

    it('TC-CLS-06: Update class details', async () => {
      const updatedName = `UpdatedClass-${Date.now()}`;
      const result = await classesService.update(
        createdClassId,
        {
          name: updatedName,
          max_second_round_subjects: 4,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updatedName);
      expect(result.data.max_second_round_subjects).toBe(4);
    });

    it('TC-CLS-07: Soft delete an unlinked class', async () => {
      const classToDel = await classesService.create(
        {
          stage_id: testStageId,
          name: `ClassToDel-${Date.now()}`,
          grade_level: testGradeLevel === 12 ? 11 : testGradeLevel + 1,
        },
        testAdminId,
      );

      const result = await classesService.remove(classToDel.data.id, testAdminId);
      expect(result.success).toBe(true);

      const deleted = await prisma.class.findUnique({
        where: { id: BigInt(classToDel.data.id) },
      });
      expect(deleted!.deleted_at).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Step 2: Master Sections (sections)
  // ---------------------------------------------------------------------------
  describe('Step 2: Master Sections Catalog (sections)', () => {
    let createdSectionId: number;

    it('TC-SEC-01: Create a master section successfully', async () => {
      const secName = `شعبة-${Date.now()}`;
      const result = await sectionsService.create(
        {
          name: secName,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(secName);
      createdSectionId = result.data.id;
    });

    it('TC-SEC-02: Fail on duplicate section name (409 Conflict)', async () => {
      const section = await prisma.section.findUnique({
        where: { id: BigInt(createdSectionId) },
      });

      await expect(
        sectionsService.create(
          {
            name: section!.name,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-SEC-03: Retrieve sections list with search', async () => {
      const result = await sectionsService.findAll({
        page: 1,
        per_page: 10,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('TC-SEC-04: Update section details', async () => {
      const updatedName = `شعبة-محدثة-${Date.now()}`;
      const result = await sectionsService.update(
        createdSectionId,
        {
          name: updatedName,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updatedName);
    });

    it('TC-SEC-05: Soft delete unlinked section', async () => {
      const secToDel = await sectionsService.create(
        {
          name: `شعبة-للحذف-${Date.now()}`,
        },
        testAdminId,
      );

      const result = await sectionsService.remove(secToDel.data.id, testAdminId);
      expect(result.success).toBe(true);

      const deleted = await prisma.section.findUnique({
        where: { id: BigInt(secToDel.data.id) },
      });
      expect(deleted!.deleted_at).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Step 3: Master Subjects Catalog (subjects)
  // ---------------------------------------------------------------------------
  describe('Step 3: Master Subjects Catalog (subjects)', () => {
    let createdSubjectId: number;
    let subjectCode: string;

    it('TC-SUB-01: Create a master subject successfully with code', async () => {
      const subName = `مادة-${Date.now()}`;
      subjectCode = `CD-${Date.now().toString().slice(-6)}`;
      const result = await subjectsService.create(
        {
          name: subName,
          code: subjectCode,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(subName);
      expect(result.data.code).toBe(subjectCode);
      createdSubjectId = result.data.id;
    });

    it('TC-SUB-02: Fail on duplicate subject name (409 Conflict)', async () => {
      const subject = await prisma.subject.findUnique({
        where: { id: BigInt(createdSubjectId) },
      });

      await expect(
        subjectsService.create(
          {
            name: subject!.name,
            code: `OTHER-${Date.now().toString().slice(-5)}`,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-SUB-03: Fail on duplicate subject code (409 Conflict)', async () => {
      await expect(
        subjectsService.create(
          {
            name: `اسم-مختلف-${Date.now()}`,
            code: subjectCode,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-SUB-04: Retrieve subjects catalog with search', async () => {
      const result = await subjectsService.findAll({
        page: 1,
        per_page: 10,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('TC-SUB-05: Update subject details', async () => {
      const updatedName = `مادة-معدلة-${Date.now()}`;
      const result = await subjectsService.update(
        createdSubjectId,
        {
          name: updatedName,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updatedName);
    });

    it('TC-SUB-06: Soft delete unlinked subject', async () => {
      const subToDel = await subjectsService.create(
        {
          name: `مادة-للحذف-${Date.now()}`,
          code: `DEL-${Date.now().toString().slice(-5)}`,
        },
        testAdminId,
      );

      const result = await subjectsService.remove(subToDel.data.id, testAdminId);
      expect(result.success).toBe(true);

      const deleted = await prisma.subject.findUnique({
        where: { id: BigInt(subToDel.data.id) },
      });
      expect(deleted!.deleted_at).not.toBeNull();
    });
  });
});
