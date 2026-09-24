import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { PromotionService } from './modules/promotion/promotion.service.js';
import { PromotionController } from './modules/promotion/promotion.controller.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  RoleType,
  TranscriptType,
  EnrollmentStatus,
  Gender,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 09: Promotion & Transcripts Archiving (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let promotionService: PromotionService;
  let promotionController: PromotionController;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testTeacherUserId: number;
  let testStudentUserId: number;
  let testParentUserId: number;

  let testAcademicYear1Id: number;
  let testAcademicYear2Id: number;
  let testAcademicTerm1Id: number;
  let testStageId: number;
  let testClass5Id: number;
  let testClass6Id: number;
  let testSectionAId: number;
  let testSectionBId: number;
  let testClass5SectionAId: number;
  let testClass5SectionBId: number;
  let testClass6SectionAId: number;
  let testClass6SectionBId: number;
  let testStudent1Id: number;
  let testStudent2Id: number;
  let testGuardianId: number;

  let createdTranscript1Id: number;
  let createdBatch1Id: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    promotionService = moduleRef.get<PromotionService>(PromotionService);
    promotionController = moduleRef.get<PromotionController>(PromotionController);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    const hashedPassword = await bcrypt.hash('SecretAdminPass123!', 10);

    // 1. Admin User
    await prisma.user.upsert({
      where: { id: BigInt(testAdminId) },
      update: { is_active: 1, role_type: RoleType.admin },
      create: {
        id: BigInt(testAdminId),
        user_code: `ADM-PR-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.admin,
        is_active: 1,
      },
    });

    // 2. Teacher User
    const teacherUser = await prisma.user.create({
      data: {
        user_code: `TCH-PR-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacherUserId = Number(teacherUser.id);

    // 3. Student User & Profile
    const studentUser = await prisma.user.create({
      data: {
        user_code: `STU-PR-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.student,
        is_active: 1,
      },
    });
    testStudentUserId = Number(studentUser.id);

    const student1 = await prisma.student.create({
      data: {
        user_id: studentUser.id,
        full_name: `طالب تجريبي ${uniqueSuffix}`,
        gender: Gender.male,
        birth_date: new Date('2014-05-15'),
      },
    });
    testStudent1Id = Number(student1.id);

    // 4. Second Student User & Profile
    const student2User = await prisma.user.create({
      data: {
        user_code: `STU2-PR-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.student,
        is_active: 1,
      },
    });

    const student2 = await prisma.student.create({
      data: {
        user_id: student2User.id,
        full_name: `طالب راسب تجريبي ${uniqueSuffix}`,
        gender: Gender.male,
        birth_date: new Date('2014-07-20'),
      },
    });
    testStudent2Id = Number(student2.id);

    // 5. Parent User & Profile & Link
    const parentUser = await prisma.user.create({
      data: {
        user_code: `PAR-PR-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.parent,
        is_active: 1,
      },
    });
    testParentUserId = Number(parentUser.id);

    const guardian = await prisma.guardian.create({
      data: {
        user_id: parentUser.id,
        full_name: `ولي أمر تجريبي ${uniqueSuffix}`,
        relationship: 'father',
        phone: `091${uniqueSuffix.slice(-7)}`,
      },
    });
    testGuardianId = Number(guardian.id);

    await prisma.guardianStudent.create({
      data: {
        guardian_id: guardian.id,
        student_id: student1.id,
        is_primary: 1,
      },
    });

    // 6. Academic Hierarchy Structure
    const year1 = await prisma.academicYear.create({
      data: {
        name: `2024/2025-${uniqueSuffix}`,
        start_date: new Date('2024-09-01'),
        end_date: new Date('2025-06-30'),
        is_active: 0,
      },
    });
    testAcademicYear1Id = Number(year1.id);

    const year2 = await prisma.academicYear.create({
      data: {
        name: `2025/2026-${uniqueSuffix}`,
        start_date: new Date('2025-09-01'),
        end_date: new Date('2026-06-30'),
        is_active: 1,
      },
    });
    testAcademicYear2Id = Number(year2.id);

    let term1 = await prisma.academicTerm.findFirst({
      where: { deleted_at: null },
      orderBy: { id: 'asc' },
    });
    if (!term1) {
      term1 = await prisma.academicTerm.create({
        data: {
          name: `الفصل الأول ${uniqueSuffix}`,
          term_number: 1,
        },
      });
    }
    testAcademicTerm1Id = Number(term1.id);

    const stage = await prisma.academicStage.create({
      data: {
        name: `المرحلة الابتدائية ${uniqueSuffix}`,
        order_index: 1,
      },
    });
    testStageId = Number(stage.id);

    const class5 = await prisma.class.create({
      data: {
        stage_id: stage.id,
        name: `الصف الخامس ${uniqueSuffix}`,
        grade_level: 5,
      },
    });
    testClass5Id = Number(class5.id);

    const class6 = await prisma.class.create({
      data: {
        stage_id: stage.id,
        name: `الصف السادس ${uniqueSuffix}`,
        grade_level: 6,
      },
    });
    testClass6Id = Number(class6.id);

    const secA = await prisma.section.create({
      data: { name: `شعبة أ ${uniqueSuffix}` },
    });
    testSectionAId = Number(secA.id);

    const secB = await prisma.section.create({
      data: { name: `شعبة ب ${uniqueSuffix}` },
    });
    testSectionBId = Number(secB.id);

    // Class Sections
    const cs5A = await prisma.classSection.create({
      data: {
        class_id: class5.id,
        section_id: secA.id,
      },
    });
    testClass5SectionAId = Number(cs5A.id);

    const cs5B = await prisma.classSection.create({
      data: {
        class_id: class5.id,
        section_id: secB.id,
      },
    });
    testClass5SectionBId = Number(cs5B.id);

    const cs6A = await prisma.classSection.create({
      data: {
        class_id: class6.id,
        section_id: secA.id,
      },
    });
    testClass6SectionAId = Number(cs6A.id);

    // Enroll students in Year 1
    await prisma.studentEnrollment.create({
      data: {
        student_id: student1.id,
        academic_year_id: year1.id,
        class_id: class5.id,
        grade_level: 5,
        class_section_id: cs5A.id,
        status: EnrollmentStatus.passed,
      },
    });

    await prisma.studentEnrollment.create({
      data: {
        student_id: student2.id,
        academic_year_id: year1.id,
        class_id: class5.id,
        grade_level: 5,
        class_section_id: cs5A.id,
        status: EnrollmentStatus.failed,
      },
    });
  });

  afterAll(async () => {
    // Cleanup records in reverse order
    if (prisma) {
      await prisma.studentTranscript.deleteMany({
        where: { academic_year_name: { contains: uniqueSuffix } },
      });
      await prisma.promotionBatch.deleteMany({
        where: {
          from_academic_year_id: BigInt(testAcademicYear1Id || 0),
        },
      });
      await prisma.studentEnrollment.deleteMany({
        where: {
          academic_year_id: {
            in: [BigInt(testAcademicYear1Id || 0), BigInt(testAcademicYear2Id || 0)],
          },
        },
      });
      await prisma.guardianStudent.deleteMany({
        where: { guardian_id: BigInt(testGuardianId || 0) },
      });
      await prisma.guardian.deleteMany({
        where: { id: BigInt(testGuardianId || 0) },
      });
      await prisma.student.deleteMany({
        where: {
          id: { in: [BigInt(testStudent1Id || 0), BigInt(testStudent2Id || 0)] },
        },
      });
      await prisma.classSection.deleteMany({
        where: {
          class_id: {
            in: [BigInt(testClass5Id || 0), BigInt(testClass6Id || 0)],
          },
        },
      });
      await prisma.class.deleteMany({
        where: { id: { in: [BigInt(testClass5Id || 0), BigInt(testClass6Id || 0)] } },
      });
      await prisma.section.deleteMany({
        where: { id: { in: [BigInt(testSectionAId || 0), BigInt(testSectionBId || 0)] } },
      });
      await prisma.academicStage.deleteMany({
        where: { id: BigInt(testStageId || 0) },
      });
      await prisma.academicYear.deleteMany({
        where: {
          id: {
            in: [BigInt(testAcademicYear1Id || 0), BigInt(testAcademicYear2Id || 0)],
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          user_code: { contains: uniqueSuffix },
        },
      });
    }
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  describe('1. Transcripts Archiving & Freezing Operations', () => {
    it('TC-TRN-05: Should freeze and archive a student transcript with JSON snapshot (201 Created)', async () => {
      const freezeDto = {
        student_id: testStudent1Id,
        transcript_type: TranscriptType.annual,
        academic_year_name: `2024/2025-${uniqueSuffix}`,
        class_name: `الصف الخامس ${uniqueSuffix}`,
        section_name: `شعبة أ ${uniqueSuffix}`,
        grade_level: 5,
        total_score: 485.5,
        percentage: 97.1,
        final_status: EnrollmentStatus.passed,
        rank: 1,
        transcript_data: {
          term_name: 'الصحيفة التجميعية السنوية',
          subjects: [
            {
              subject_id: 1,
              subject_name: 'الرياضيات',
              coursework_score: 38,
              max_coursework_score: 40,
              exam_score: 58,
              max_exam_score: 60,
              total_score: 96,
              passing_score: 50,
              max_score: 100,
              status: 'passed',
            },
          ],
        },
      };

      const result = await promotionService.freezeTranscript(
        freezeDto,
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
      expect(result.data.student_id).toBe(testStudent1Id);
      expect(result.data.final_status).toBe(EnrollmentStatus.passed);

      createdTranscript1Id = result.data.id;
    });

    it('TC-TRN-06: Should reject duplicate freeze for same student & term (409 Conflict)', async () => {
      const duplicateDto = {
        student_id: testStudent1Id,
        transcript_type: TranscriptType.annual,
        academic_year_name: `2024/2025-${uniqueSuffix}`,
        class_name: `الصف الخامس ${uniqueSuffix}`,
        section_name: `شعبة أ ${uniqueSuffix}`,
        grade_level: 5,
        total_score: 485.5,
        percentage: 97.1,
        final_status: EnrollmentStatus.passed,
        rank: 1,
        transcript_data: { subjects: [] },
      };

      await expect(
        promotionService.freezeTranscript(duplicateDto, testAdminId),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-TRN-01: Should browse and filter transcripts list with executive class summaries (200 OK)', async () => {
      const result = await promotionService.getTranscripts({
        academic_year_name: `2024/2025-${uniqueSuffix}`,
        grade_level: 5,
        sort_by: 'percentage',
        sort_order: 'desc',
        page: 1,
        per_page: 15,
      });

      expect(result.success).toBe(true);
      expect(result.data.classes_summary).toBeDefined();
      expect(Array.isArray(result.data.classes_summary)).toBe(true);
      expect(result.data.transcripts.length).toBeGreaterThanOrEqual(1);
      expect(result.data.transcripts[0].percentage).toBe(97.1);
    });

    it('TC-TRN-02: Should search transcripts by student name or code (200 OK)', async () => {
      const result = await promotionService.getTranscripts({
        academic_year_name: `2024/2025-${uniqueSuffix}`,
        search: uniqueSuffix,
      });

      expect(result.success).toBe(true);
      expect(result.data.transcripts.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-TRN-03: Should retrieve transcript details & JSON snapshot by ID (200 OK)', async () => {
      const result = await promotionService.getTranscriptById(
        createdTranscript1Id,
        { id: testAdminId, role_type: RoleType.admin },
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdTranscript1Id);
      expect(result.data.transcript_data).toBeDefined();
      expect(result.data.total_score).toBe(485.5);
    });

    it('TC-TRN-04: Should retrieve student historical transcripts (200 OK)', async () => {
      const result = await promotionService.getStudentTranscripts(
        testStudent1Id,
        {},
        { id: testAdminId, role_type: RoleType.admin },
      );

      expect(result.success).toBe(true);
      expect(result.data.student_id).toBe(testStudent1Id);
      expect(result.data.transcripts.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-TRN-06-UPD: Should successfully update existing transcript when allow_update is true (no duplicates)', async () => {
      const updateDto = {
        student_id: testStudent1Id,
        transcript_type: TranscriptType.annual,
        academic_year_name: `2024/2025-${uniqueSuffix}`,
        class_name: `الصف الخامس ${uniqueSuffix}`,
        section_name: `شعبة أ ${uniqueSuffix}`,
        grade_level: 5,
        total_score: 490.0,
        percentage: 98.0,
        final_status: EnrollmentStatus.passed,
        rank: 1,
        transcript_data: { subjects: [{ subject_id: 1, total_score: 100 }] },
        allow_update: true,
      };

      const result = await promotionService.freezeTranscript(
        updateDto,
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdTranscript1Id);
      expect(result.data.updated_at).toBeDefined();

      // Verify no duplicate record was created
      const count = await prisma.studentTranscript.count({
        where: {
          student_id: BigInt(testStudent1Id),
          academic_year_name: `2024/2025-${uniqueSuffix}`,
          transcript_type: TranscriptType.annual,
          deleted_at: null,
        },
      });
      expect(count).toBe(1);

      // Verify record values were updated
      const updatedRecord = await prisma.studentTranscript.findUnique({
        where: { id: BigInt(createdTranscript1Id) },
      });
      expect(Number(updatedRecord?.total_score)).toBe(490.0);
      expect(Number(updatedRecord?.percentage)).toBe(98.0);
    });
  });

  describe('2. Batch Promotion & Low Enrollment Warning Operations', () => {
    it('TC-PRM-03: Should simulate promotion results & generate low enrollment warnings (200 OK)', async () => {
      const previewDto = {
        from_academic_year_id: testAcademicYear1Id,
        to_academic_year_id: testAcademicYear2Id,
      };

      const result = await promotionService.previewPromotion(previewDto);

      expect(result.success).toBe(true);
      expect(result.data.summary.total_students).toBe(2);
      expect(result.data.summary.to_be_promoted).toBe(1);
      expect(result.data.summary.retained).toBe(1);
      expect(result.data.low_enrollment_warnings).toBeDefined();
      // Since counts are 1 student per section (< 10), warnings should be triggered
      expect(result.data.low_enrollment_warnings.length).toBeGreaterThanOrEqual(1);
    });

    it('TC-PRM-04: Should execute atomic batch promotion & section continuity assignment (200 OK)', async () => {
      const executeDto = {
        from_academic_year_id: testAcademicYear1Id,
        to_academic_year_id: testAcademicYear2Id,
        execution_notes: 'تنفيذ الترحيل السنوي للاختبار.',
      };

      const result = await promotionService.executePromotion(
        executeDto,
        testAdminId,
      );

      expect(result.success).toBe(true);
      expect(result.data.batch_id).toBeDefined();
      expect(result.data.total_processed).toBe(2);

      createdBatch1Id = result.data.batch_id;

      // Verify that student 1 (passed) was enrolled in Class 6 in year 2
      const student1NewEnrollment = await prisma.studentEnrollment.findFirst({
        where: {
          student_id: BigInt(testStudent1Id),
          academic_year_id: BigInt(testAcademicYear2Id),
          deleted_at: null,
        },
        include: { class_section: { include: { class: true } } },
      });

      expect(student1NewEnrollment).toBeDefined();
      expect(student1NewEnrollment?.class_section.class.grade_level).toBe(6);

      // Verify that student 2 (failed) was enrolled in Class 5 in year 2
      const student2NewEnrollment = await prisma.studentEnrollment.findFirst({
        where: {
          student_id: BigInt(testStudent2Id),
          academic_year_id: BigInt(testAcademicYear2Id),
          deleted_at: null,
        },
        include: { class_section: { include: { class: true } } },
      });

      expect(student2NewEnrollment).toBeDefined();
      expect(student2NewEnrollment?.class_section.class.grade_level).toBe(5);

      // Verify that the target academic year is activated and other years deactivated
      const activeYear = await prisma.academicYear.findUnique({
        where: { id: BigInt(testAcademicYear2Id) },
      });
      expect(activeYear?.is_active).toBe(1);

      const previousYear = await prisma.academicYear.findUnique({
        where: { id: BigInt(testAcademicYear1Id) },
      });
      expect(previousYear?.is_active).toBe(0);

      // Verify that Term 1 is activated for classes
      const activeTerms = await prisma.classAcademicTerm.findMany({
        where: {
          academic_term_id: BigInt(testAcademicTerm1Id),
          deleted_at: null,
        },
      });
      for (const ct of activeTerms) {
        expect(ct.is_active).toBe(1);
      }
    });

    it('TC-PRM-05: Should reject executing promotion between years that were already promoted (409 Conflict)', async () => {
      const duplicateExecuteDto = {
        from_academic_year_id: testAcademicYear1Id,
        to_academic_year_id: testAcademicYear2Id,
      };

      await expect(
        promotionService.executePromotion(duplicateExecuteDto, testAdminId),
      ).rejects.toThrow(ConflictException);
    });

    it('TC-PRM-01: Should get promotion batches list (200 OK)', async () => {
      const result = await promotionService.getPromotionBatches(1, 15);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data[0].id).toBe(createdBatch1Id);
      expect(result.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('TC-PRM-02: Should get promotion batch by ID (200 OK)', async () => {
      const result = await promotionService.getPromotionBatchById(createdBatch1Id);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdBatch1Id);
      expect(result.data.total_students).toBe(2);
      expect(result.data.class_statistics).toBeDefined();
    });
  });

  describe('3. Security & RBAC Enforcement', () => {
    it('TC-RBAC-01: Should prevent non-admin from freezing transcript via controller guard', async () => {
      const freezeDto = {
        student_id: testStudent1Id,
        transcript_type: TranscriptType.annual,
        academic_year_name: `2024/2025-${uniqueSuffix}`,
        class_name: `الصف الخامس ${uniqueSuffix}`,
        section_name: `شعبة أ ${uniqueSuffix}`,
        grade_level: 5,
        total_score: 400,
        percentage: 80,
        final_status: EnrollmentStatus.passed,
        transcript_data: {},
      };

      const teacherUserObj = { id: testTeacherUserId, role_type: RoleType.teacher };

      await expect(
        promotionController.freezeTranscript(
          freezeDto,
          teacherUserObj,
          {} as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-RBAC-02: Should allow student to view own transcript but reject viewing another student transcript', async () => {
      // Student 1 viewing own transcript -> OK
      const student1UserObj = { id: testStudentUserId, role_type: RoleType.student };
      const ownResult = await promotionService.getTranscriptById(
        createdTranscript1Id,
        student1UserObj,
      );
      expect(ownResult.success).toBe(true);
      expect(ownResult.data.student_id).toBe(testStudent1Id);

      // Student 2 trying to view Student 1 transcript -> Forbidden
      const student2User = await prisma.user.findFirst({
        where: { user_code: `STU2-PR-${uniqueSuffix}` },
      });
      const student2UserObj = { id: Number(student2User?.id), role_type: RoleType.student };

      await expect(
        promotionService.getTranscriptById(
          createdTranscript1Id,
          student2UserObj,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-AUDIT-01: Should record freeze and promotion actions in audit_logs', async () => {
      const freezeLog = await prisma.auditLog.findFirst({
        where: {
          entity_type: 'student_transcripts',
          entity_id: BigInt(createdTranscript1Id),
        },
      });
      expect(freezeLog).toBeDefined();
      expect(freezeLog?.user_id).toBe(BigInt(testAdminId));

      const promotionLog = await prisma.auditLog.findFirst({
        where: {
          entity_type: 'promotion_batches',
          entity_id: BigInt(createdBatch1Id),
        },
      });
      expect(promotionLog).toBeDefined();
      expect(promotionLog?.user_id).toBe(BigInt(testAdminId));
    });

    it('TC-GRADE-01: Should fetch sections audit progress correctly', async () => {
      const res = await promotionController.getSectionAuditProgress({
        academic_year_name: '2025-2026',
      });
      expect(res.success).toBe(true);
      expect(res.data).toHaveProperty('sections');
      expect(Array.isArray(res.data.sections)).toBe(true);
    });

    it('TC-GRADE-02: Should fetch section student roster with grading status', async () => {
      const res = await promotionController.getSectionRoster(testClass5SectionAId, {
        academic_year_name: '2025-2026',
      });
      expect(res.success).toBe(true);
      expect(res.data).toHaveProperty('students');
      expect(res.data).toHaveProperty('subjects');
      expect(res.data).toHaveProperty('class_section');
    });
  });
});

