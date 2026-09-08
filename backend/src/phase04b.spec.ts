import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { StudentEnrollmentsService } from './modules/student-enrollments/student-enrollments.service.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoleType, Gender, EnrollmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 04-B: Student Enrollments Registry (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let enrollmentsService: StudentEnrollmentsService;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testTeacherUserId: number;
  let testStudent1UserId: number;
  let testStudent2UserId: number;

  let testYearId: number;
  let testStageId: number;
  let testClass5Id: number;
  let testClass9Id: number;
  let testSectionAId: number;
  let testSectionBId: number;
  let testClass5SectionAId: number;
  let testClass5SectionBId: number;
  let testClass9SectionAId: number;

  let testStudent1Id: number;
  let testStudent2Id: number;
  let testStudent3Id: number;
  let testStudent4Id: number;
  let testStudent5Id: number;

  let enrollment1Id: number;
  let enrollment2Id: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    enrollmentsService = moduleRef.get<StudentEnrollmentsService>(StudentEnrollmentsService);
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

    // 2. Create Teacher User
    const teacherUser = await prisma.user.create({
      data: {
        user_code: `TCH-${uniqueSuffix}`,
        password: hashedPassword,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    testTeacherUserId = Number(teacherUser.id);

    // 3. Setup Academic Year
    const year = await prisma.academicYear.create({
      data: {
        name: `2025/2026-${uniqueSuffix}`,
        start_date: new Date('2025-09-01'),
        end_date: new Date('2026-06-30'),
        is_active: 1,
      },
    });
    testYearId = Number(year.id);

    // 4. Setup Stage, Classes and Sections
    const stage = await prisma.academicStage.create({
      data: {
        name: `مرحلة أساسية-${uniqueSuffix}`,
        order_index: 10,
      },
    });
    testStageId = Number(stage.id);

    const cls5 = await prisma.class.create({
      data: {
        stage_id: stage.id,
        name: `الصف الخامس-${uniqueSuffix}`,
        grade_level: 5,
      },
    });
    testClass5Id = Number(cls5.id);

    const cls9 = await prisma.class.create({
      data: {
        stage_id: stage.id,
        name: `الصف التاسع-${uniqueSuffix}`,
        grade_level: 9,
      },
    });
    testClass9Id = Number(cls9.id);

    const secA = await prisma.section.create({
      data: { name: `شعبة أ-${uniqueSuffix}` },
    });
    testSectionAId = Number(secA.id);

    const secB = await prisma.section.create({
      data: { name: `شعبة ب-${uniqueSuffix}` },
    });
    testSectionBId = Number(secB.id);

    const c5sA = await prisma.classSection.create({
      data: { class_id: cls5.id, section_id: secA.id },
    });
    testClass5SectionAId = Number(c5sA.id);

    const c5sB = await prisma.classSection.create({
      data: { class_id: cls5.id, section_id: secB.id },
    });
    testClass5SectionBId = Number(c5sB.id);

    const c9sA = await prisma.classSection.create({
      data: { class_id: cls9.id, section_id: secA.id },
    });
    testClass9SectionAId = Number(c9sA.id);

    // 5. Create 5 Students
    const createStudentHelper = async (code: string, name: string) => {
      const u = await prisma.user.create({
        data: {
          user_code: code,
          password: hashedPassword,
          role_type: RoleType.student,
          is_active: 1,
        },
      });
      const s = await prisma.student.create({
        data: {
          user_id: u.id,
          full_name: name,
          gender: Gender.male,
        },
      });
      return { userId: Number(u.id), studentId: Number(s.id) };
    };

    const s1 = await createStudentHelper(`STU-3001-${uniqueSuffix}`, `محمد علي الفيتوري-${uniqueSuffix}`);
    testStudent1UserId = s1.userId;
    testStudent1Id = s1.studentId;

    const s2 = await createStudentHelper(`STU-3002-${uniqueSuffix}`, `فاطمة أحمد سالم-${uniqueSuffix}`);
    testStudent2UserId = s2.userId;
    testStudent2Id = s2.studentId;

    const s3 = await createStudentHelper(`STU-3003-${uniqueSuffix}`, `أنس خالد السويح-${uniqueSuffix}`);
    testStudent3Id = s3.studentId;

    const s4 = await createStudentHelper(`STU-3004-${uniqueSuffix}`, `يوسف محمود الزوي-${uniqueSuffix}`);
    testStudent4Id = s4.studentId;

    const s5 = await createStudentHelper(`STU-3005-${uniqueSuffix}`, `حمزة المهدي-${uniqueSuffix}`);
    testStudent5Id = s5.studentId;
  });

  afterAll(async () => {
    // Clean up created records in reverse order
    await prisma.studentTranscript.deleteMany({
      where: { student_id: { in: [BigInt(testStudent1Id), BigInt(testStudent2Id)] } },
    });
    await prisma.studentEnrollment.deleteMany({
      where: {
        student_id: {
          in: [
            BigInt(testStudent1Id),
            BigInt(testStudent2Id),
            BigInt(testStudent3Id),
            BigInt(testStudent4Id),
            BigInt(testStudent5Id),
          ],
        },
      },
    });
    await prisma.student.deleteMany({
      where: {
        id: {
          in: [
            BigInt(testStudent1Id),
            BigInt(testStudent2Id),
            BigInt(testStudent3Id),
            BigInt(testStudent4Id),
            BigInt(testStudent5Id),
          ],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            BigInt(testStudent1UserId),
            BigInt(testStudent2UserId),
            BigInt(testTeacherUserId),
          ],
        },
      },
    });
    await prisma.classSection.deleteMany({
      where: {
        id: {
          in: [
            BigInt(testClass5SectionAId),
            BigInt(testClass5SectionBId),
            BigInt(testClass9SectionAId),
          ],
        },
      },
    });
    await prisma.class.deleteMany({
      where: { id: { in: [BigInt(testClass5Id), BigInt(testClass9Id)] } },
    });
    await prisma.section.deleteMany({
      where: { id: { in: [BigInt(testSectionAId), BigInt(testSectionBId)] } },
    });
    await prisma.academicStage.deleteMany({
      where: { id: BigInt(testStageId) },
    });
    await prisma.academicYear.deleteMany({
      where: { id: BigInt(testYearId) },
    });

    await moduleRef.close();
  });

  // --------------------------------------------------------------------------
  // STEP 1: ENROLLMENT LIFECYCLE & INVARIANTS (TC-ENR-01 -> TC-ENR-12)
  // --------------------------------------------------------------------------
  describe('Step 1: Student Enrollments Registry (student_enrollments)', () => {
    it('TC-ENR-05: Should enroll student successfully with auto-derived grade_level', async () => {
      const dto = {
        academic_year_id: testYearId,
        student_id: testStudent1Id,
        class_section_id: testClass5SectionAId,
        seating_number: 'SEAT-5001',
        status: EnrollmentStatus.enrolled,
      };

      const result = await enrollmentsService.create(dto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم تسكين وتنسيق الطالب');
      expect(result.data).toBeDefined();
      expect(result.data.student_id).toBe(testStudent1Id);
      expect(result.data.class_id).toBe(testClass5Id);
      expect(result.data.grade_level).toBe(5); // Auto-derived from class5.grade_level
      expect(result.data.class_section_id).toBe(testClass5SectionAId);
      expect(result.data.seating_number).toBe('SEAT-5001');
      expect(result.data.status).toBe('enrolled');

      enrollment1Id = result.data.id;
    });

    it('TC-ENR-06: Should enforce uq_student_year_enrollment invariant (reject duplicate enrollment in same year)', async () => {
      const dto = {
        academic_year_id: testYearId,
        student_id: testStudent1Id,
        class_section_id: testClass5SectionBId, // Attempt to enroll in section B of same year
        seating_number: 'SEAT-5002',
      };

      await expect(enrollmentsService.create(dto, testAdminId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('TC-ENR-07: Should reject enrollment with non-existent student or invalid section', async () => {
      await expect(
        enrollmentsService.create(
          {
            academic_year_id: testYearId,
            student_id: 999999,
            class_section_id: testClass5SectionAId,
          },
          testAdminId,
        ),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        enrollmentsService.create(
          {
            academic_year_id: testYearId,
            student_id: testStudent2Id,
            class_section_id: 999999,
          },
          testAdminId,
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('TC-ENR-01: Should retrieve hierarchical enrollment matrix grouped by classes and sections', async () => {
      // Enroll student 2 in class 5 section A
      const res2 = await enrollmentsService.create(
        {
          academic_year_id: testYearId,
          student_id: testStudent2Id,
          class_section_id: testClass5SectionAId,
          seating_number: 'SEAT-5002',
        },
        testAdminId,
      );
      enrollment2Id = res2.data.id;

      const result = await enrollmentsService.findAll({
        academic_year_id: testYearId,
      });

      expect(result.success).toBe(true);
      expect(result.data.academic_year_id).toBe(testYearId);
      expect(Array.isArray(result.data.classes)).toBe(true);

      const cls5 = result.data.classes.find((c: any) => c.class_id === testClass5Id);
      expect(cls5).toBeDefined();
      expect(cls5.grade_level).toBe(5);
      expect(Array.isArray(cls5.sections)).toBe(true);

      const secA = cls5.sections.find((s: any) => s.class_section_id === testClass5SectionAId);
      expect(secA).toBeDefined();
      expect(secA.enrolled_count).toBeGreaterThanOrEqual(2);
      expect(secA.students.some((s: any) => s.student_id === testStudent1Id)).toBe(true);
    });

    it('TC-ENR-02: Should filter enrollment matrix by class_id', async () => {
      const result = await enrollmentsService.findAll({
        academic_year_id: testYearId,
        class_id: testClass5Id,
      });

      expect(result.success).toBe(true);
      expect(result.data.classes.every((c: any) => c.class_id === testClass5Id)).toBe(true);
    });

    it('TC-ENR-03: Should search students in matrix by name, student_code, or seating_number', async () => {
      const result = await enrollmentsService.findAll({
        academic_year_id: testYearId,
        search: 'SEAT-5001',
      });

      expect(result.success).toBe(true);
      const cls5 = result.data.classes.find((c: any) => c.class_id === testClass5Id);
      expect(cls5).toBeDefined();
      const secA = cls5.sections.find((s: any) => s.class_section_id === testClass5SectionAId);
      expect(secA.students.some((s: any) => s.seating_number === 'SEAT-5001')).toBe(true);
    });

    it('TC-ENR-08: Should update enrollment (transfer section within class & update seating_number)', async () => {
      const updateDto = {
        class_section_id: testClass5SectionBId,
        seating_number: 'SEAT-5001-UPDATED',
        status: EnrollmentStatus.enrolled,
      };

      const result = await enrollmentsService.update(enrollment1Id, updateDto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم تحديث بيانات التسكين');
      expect(result.data.class_section_id).toBe(testClass5SectionBId);
      expect(result.data.seating_number).toBe('SEAT-5001-UPDATED');
    });

    it('TC-ENR-09: Should bulk enroll multiple students into a section atomically', async () => {
      const bulkDto = {
        academic_year_id: testYearId,
        class_section_id: testClass9SectionAId,
        student_ids: [testStudent3Id, testStudent4Id, testStudent5Id],
      };

      const result = await enrollmentsService.bulkEnroll(bulkDto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.data.enrolled_count).toBe(3);
      expect(result.data.class_id).toBe(testClass9Id);
      expect(result.data.class_section_id).toBe(testClass9SectionAId);

      // Verify enrollments in DB
      const count = await prisma.studentEnrollment.count({
        where: {
          academic_year_id: BigInt(testYearId),
          class_section_id: BigInt(testClass9SectionAId),
          deleted_at: null,
        },
      });
      expect(count).toBe(3);
    });

    it('TC-ENR-10: Should reject bulk enrollment if any student is already enrolled in the academic year (atomic rollback)', async () => {
      const bulkDto = {
        academic_year_id: testYearId,
        class_section_id: testClass5SectionAId,
        student_ids: [testStudent3Id], // student 3 is already enrolled in class 9 section A for this year
      };

      await expect(enrollmentsService.bulkEnroll(bulkDto, testAdminId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('TC-ENR-04: Should retrieve historical progression archive for student from transcripts and active enrollments', async () => {
      // Create a historical transcript record for student 1
      await prisma.studentTranscript.create({
        data: {
          student_id: BigInt(testStudent1Id),
          academic_year_name: '2024/2025',
          class_name: 'الصف الرابع',
          section_name: 'شعبة ب',
          grade_level: 4,
          total_score: 850.0,
          percentage: 85.0,
          final_status: EnrollmentStatus.passed,
          transcript_data: {},
        },
      });

      const result = await enrollmentsService.getStudentEnrollments(testStudent1Id, {
        id: testAdminId,
        role_type: RoleType.admin,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(2); // 1 active enrollment + 1 archived transcript
      expect(result.data.some((e: any) => e.academic_year_name === '2024/2025')).toBe(true);
      expect(result.data.some((e: any) => e.grade_level === 5)).toBe(true);
    });

    it('TC-ENR-11: Should prevent deleting enrollment linked to transcripts/grades/exams (RESTRICT)', async () => {
      // Student 1 has a transcript, attempting to delete enrollment should throw ConflictException
      await expect(enrollmentsService.delete(enrollment1Id, testAdminId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('TC-ENR-12: Should soft delete unlinked enrollment successfully', async () => {
      // Student 2 has no transcripts or grades, should soft delete cleanly
      const result = await enrollmentsService.delete(enrollment2Id, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم إلغاء سجل التسكين');

      // Check soft delete in DB
      const deletedEnrollment = await prisma.studentEnrollment.findUnique({
        where: { id: BigInt(enrollment2Id) },
      });
      expect(deletedEnrollment?.deleted_at).not.toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // STEP 2: SECURITY, RBAC & AUDIT TESTS (TC-RBAC-01 -> TC-RBAC-03, TC-AUDIT-01)
  // --------------------------------------------------------------------------
  describe('Step 2: Security, RBAC & Audit Verification', () => {
    it('TC-RBAC-02: Student should be forbidden from accessing another student historical progression archive', async () => {
      const student1User = {
        id: testStudent1UserId,
        role_type: RoleType.student,
      };

      // Student 1 accessing Student 2's history -> Forbidden
      await expect(
        enrollmentsService.getStudentEnrollments(testStudent2Id, student1User),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-RBAC-03: Student should be allowed to view their own historical progression archive', async () => {
      const student1User = {
        id: testStudent1UserId,
        role_type: RoleType.student,
      };

      const result = await enrollmentsService.getStudentEnrollments(testStudent1Id, student1User);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('TC-AUDIT-01: Actions must be recorded in audit_logs with action names and metadata', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { user_id: BigInt(testAdminId) },
        orderBy: { id: 'desc' },
        take: 10,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(
        logs.some(
          (l) =>
            l.action.includes('enrollment') ||
            l.action.includes('bulk_enroll'),
        ),
      ).toBe(true);
    });
  });
});
