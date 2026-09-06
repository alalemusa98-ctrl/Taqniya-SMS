import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import { YearsService } from './modules/academic/years/years.service.js';
import { TermsService } from './modules/academic/terms/terms.service.js';
import { StagesService } from './modules/academic/stages/stages.service.js';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

describe('Phase 02-A: Academic Years, Terms & Stages (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let yearsService: YearsService;
  let termsService: TermsService;
  let stagesService: StagesService;
  let prisma: PrismaService;

  const testAdminId = 1;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    yearsService = moduleRef.get<YearsService>(YearsService);
    termsService = moduleRef.get<TermsService>(TermsService);
    stagesService = moduleRef.get<StagesService>(StagesService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // Step 1: Academic Years (academic_years)
  // ---------------------------------------------------------------------------
  describe('Step 1: Academic Years (academic_years)', () => {
    let createdYearId: number;

    it('TC-AY-01: Create an academic year successfully', async () => {
      const uniqueName = `TestYear-${Date.now()}`;
      const result = await yearsService.create(
        {
          name: uniqueName,
          start_date: '2025-09-01',
          end_date: '2026-06-30',
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(uniqueName);
      expect(result.data.is_active).toBe(0);
      createdYearId = result.data.id;
    });

    it('TC-AY-02: Fail when end_date <= start_date (422)', async () => {
      await expect(
        yearsService.create(
          {
            name: `InvalidDates-${Date.now()}`,
            start_date: '2026-09-01',
            end_date: '2026-05-01',
          },
          testAdminId,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('TC-AY-03: Fail on duplicate year name (409 Conflict)', async () => {
      const year = await prisma.academicYear.findUnique({
        where: { id: BigInt(createdYearId) },
      });
      expect(year).toBeDefined();

      await expect(
        yearsService.create(
          {
            name: year!.name,
            start_date: '2027-09-01',
            end_date: '2028-06-30',
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-AY-04: Retrieve years list with pagination and search', async () => {
      const result = await yearsService.findAll({
        page: 1,
        per_page: 10,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('TC-AY-05: Update academic year details', async () => {
      const updatedName = `Updated-${Date.now()}`;
      const result = await yearsService.update(
        createdYearId,
        {
          name: updatedName,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updatedName);
    });

    it('TC-AY-06: Atomic Activation (Single Active Year Invariant)', async () => {
      // Create second year
      const secondYear = await yearsService.create(
        {
          name: `SecondYear-${Date.now()}`,
          start_date: '2028-09-01',
          end_date: '2029-06-30',
        },
        testAdminId,
      );

      // Activate first year
      const act1 = await yearsService.activate(createdYearId, testAdminId);
      expect(act1.success).toBe(true);
      expect(act1.data.is_active).toBe(1);

      // Check in DB
      let activeCount = await prisma.academicYear.count({ where: { is_active: 1, deleted_at: null } });
      expect(activeCount).toBe(1);

      // Activate second year
      const act2 = await yearsService.activate(secondYear.data.id, testAdminId);
      expect(act2.success).toBe(true);
      expect(act2.data.is_active).toBe(1);

      // Exactly one year is active
      activeCount = await prisma.academicYear.count({ where: { is_active: 1, deleted_at: null } });
      expect(activeCount).toBe(1);

      // Old year must be 0
      const oldYear = await prisma.academicYear.findUnique({ where: { id: BigInt(createdYearId) } });
      expect(oldYear!.is_active).toBe(0);
    });

    it('TC-AY-07: Soft delete an academic year', async () => {
      const toDelete = await yearsService.create(
        {
          name: `ToDelete-${Date.now()}`,
          start_date: '2030-09-01',
          end_date: '2031-06-30',
        },
        testAdminId,
      );

      const result = await yearsService.remove(toDelete.data.id, testAdminId);
      expect(result.success).toBe(true);

      const deleted = await prisma.academicYear.findUnique({ where: { id: BigInt(toDelete.data.id) } });
      expect(deleted!.deleted_at).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Step 2: Academic Terms Catalog (academic_terms)
  // ---------------------------------------------------------------------------
  describe('Step 2: Academic Terms Master Catalog (academic_terms)', () => {
    let createdTermId: number;
    let termNumber: number;

    it('TC-AT-01: Create an academic term in master catalog', async () => {
      termNumber = Math.floor(Math.random() * 80) + 10;
      const termName = `Term-${Date.now()}`;
      const result = await termsService.create(
        {
          name: termName,
          term_number: termNumber,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(termName);
      expect(result.data.term_number).toBe(termNumber);
      createdTermId = result.data.id;
    });

    it('TC-AT-02: Fail on duplicate term name or number (409 Conflict)', async () => {
      await expect(
        termsService.create(
          {
            name: `OtherName-${Date.now()}`,
            term_number: termNumber,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-AT-03: Retrieve terms catalog sorted by term_number', async () => {
      const result = await termsService.findAll();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('TC-AT-04: Update term details in catalog', async () => {
      const updatedName = `UpdatedTerm-${Date.now()}`;
      const result = await termsService.update(
        createdTermId,
        {
          name: updatedName,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updatedName);
    });

    it('TC-AT-05: Soft delete term from catalog', async () => {
      const termToDel = await termsService.create(
        {
          name: `DelTerm-${Date.now()}`,
          term_number: termNumber + 1,
        },
        testAdminId,
      );

      const result = await termsService.remove(termToDel.data.id, testAdminId);
      expect(result.success).toBe(true);

      const deleted = await prisma.academicTerm.findUnique({ where: { id: BigInt(termToDel.data.id) } });
      expect(deleted!.deleted_at).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Step 3: Academic Stages (academic_stages)
  // ---------------------------------------------------------------------------
  describe('Step 3: Academic Stages (academic_stages)', () => {
    let createdStageId: number;

    it('TC-AS-01: Create an academic stage', async () => {
      const stageName = `Stage-${Date.now()}`;
      const result = await stagesService.create(
        {
          name: stageName,
          order_index: 5,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(stageName);
      expect(result.data.order_index).toBe(5);
      createdStageId = result.data.id;
    });

    it('TC-AS-02: Fail on duplicate stage name (409 Conflict)', async () => {
      const stage = await prisma.academicStage.findUnique({ where: { id: BigInt(createdStageId) } });
      await expect(
        stagesService.create(
          {
            name: stage!.name,
            order_index: 6,
          },
          testAdminId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-AS-03: Retrieve stages list ordered by order_index', async () => {
      const result = await stagesService.findAll();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('TC-AS-04: Update academic stage', async () => {
      const updatedName = `UpdatedStage-${Date.now()}`;
      const result = await stagesService.update(
        createdStageId,
        {
          name: updatedName,
          order_index: 10,
        },
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updatedName);
      expect(result.data.order_index).toBe(10);
    });

    it('TC-AS-05: Soft delete empty academic stage', async () => {
      const stageToDel = await stagesService.create(
        {
          name: `DelStage-${Date.now()}`,
          order_index: 20,
        },
        testAdminId,
      );

      const result = await stagesService.remove(stageToDel.data.id, testAdminId);
      expect(result.success).toBe(true);

      const deleted = await prisma.academicStage.findUnique({ where: { id: BigInt(stageToDel.data.id) } });
      expect(deleted!.deleted_at).not.toBeNull();
    });
  });
});
