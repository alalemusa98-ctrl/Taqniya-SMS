import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { StudentsService } from './modules/students/students.service.js';
import { GuardiansService } from './modules/guardians/guardians.service.js';
import { GuardianStudentsService } from './modules/guardian-students/guardian-students.service.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoleType, Gender, GuardianRelationship } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 04-A: Students, Guardians & Custody Registry (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let studentsService: StudentsService;
  let guardiansService: GuardiansService;
  let guardianStudentsService: GuardianStudentsService;
  let prisma: PrismaService;

  const testAdminId = 1;
  let testYearId: number;
  let testClassId: number;
  let testClassSectionId: number;

  let createdStudentId: number;
  let createdStudentUserId: number;
  let createdStudentCode: string;

  let createdGuardianId: number;
  let createdGuardianUserId: number;
  let createdGuardianCode: string;

  let createdCustodyId: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    studentsService = moduleRef.get<StudentsService>(StudentsService);
    guardiansService = moduleRef.get<GuardiansService>(GuardiansService);
    guardianStudentsService = moduleRef.get<GuardianStudentsService>(GuardianStudentsService);
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
        order_index: 90,
      },
    });

    const cls = await prisma.class.create({
      data: {
        stage_id: stage.id,
        name: `الصف التجريبي-${uniqueSuffix}`,
        grade_level: 5,
      },
    });
    testClassId = Number(cls.id);

    const baseSection = await prisma.section.create({
      data: {
        name: `شعبة أ-${uniqueSuffix}`,
      },
    });

    const section = await prisma.classSection.create({
      data: {
        class_id: cls.id,
        section_id: baseSection.id,
      },
    });
    testClassSectionId = Number(section.id);
  });

  afterAll(async () => {
    // Cleanup created test records
    if (createdCustodyId) {
      await prisma.guardianStudent.deleteMany({ where: { id: BigInt(createdCustodyId) } });
    }
    if (createdStudentId) {
      await prisma.studentEnrollment.deleteMany({ where: { student_id: BigInt(createdStudentId) } });
      await prisma.student.deleteMany({ where: { id: BigInt(createdStudentId) } });
    }
    if (createdStudentUserId) {
      await prisma.user.deleteMany({ where: { id: BigInt(createdStudentUserId) } });
    }
    if (createdGuardianId) {
      await prisma.guardian.deleteMany({ where: { id: BigInt(createdGuardianId) } });
    }
    if (createdGuardianUserId) {
      await prisma.user.deleteMany({ where: { id: BigInt(createdGuardianUserId) } });
    }
    await moduleRef.close();
  });

  // --------------------------------------------------------------------------
  // STEP 1: STUDENTS REGISTRY (TC-STU-01 -> TC-STU-08)
  // --------------------------------------------------------------------------
  describe('Step 1: Students Management (students)', () => {
    it('TC-STU-04: Should create student without enrollment and atomically generate STU-XXXX user code', async () => {
      const dto = {
        full_name: `طارق الورفلي-${uniqueSuffix}`,
        gender: Gender.male,
        phone: `0911${uniqueSuffix.slice(-6)}`,
        birth_date: '2015-08-10',
        password: 'Password123!',
      };

      const result = await studentsService.create(dto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم إنشاء ملف الطالب');
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.user_id).toBeDefined();
      expect(result.data.user_code).toMatch(/^STU-\d+$/);
      expect(result.data.full_name).toBe(dto.full_name);
      expect(result.data.enrollment).toBeNull();

      createdStudentId = result.data.id;
      createdStudentUserId = result.data.user_id;
      createdStudentCode = result.data.user_code;

      // Verify User in DB
      const user = await prisma.user.findUnique({
        where: { id: BigInt(createdStudentUserId) },
      });
      expect(user).toBeDefined();
      expect(user?.role_type).toBe(RoleType.student);
      expect(user?.is_active).toBe(1);
    });

    it('TC-STU-04B: Should create student with immediate enrollment when class_section_id is supplied', async () => {
      const dto = {
        full_name: `محمد أحمد الفيتوري-${uniqueSuffix}`,
        gender: Gender.male,
        birth_date: '2015-05-12',
        password: 'Password123!',
        class_section_id: testClassSectionId,
        academic_year_id: testYearId,
        seating_number: '105',
      };

      const result = await studentsService.create(dto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.data.enrollment).toBeDefined();
      expect(result.data.enrollment?.class_section_id).toBe(testClassSectionId);
      expect(result.data.enrollment?.seating_number).toBe('105');
      expect(result.data.enrollment?.status).toBe('enrolled');

      // Cleanup this second student
      await prisma.studentEnrollment.deleteMany({ where: { student_id: BigInt(result.data.id) } });
      await prisma.student.deleteMany({ where: { id: BigInt(result.data.id) } });
      await prisma.user.deleteMany({ where: { id: BigInt(result.data.user_id) } });
    });

    it('TC-STU-01: Should retrieve list of students with pagination and gender filtering', async () => {
      const result = await studentsService.findAll({
        gender: 'male',
        page: 1,
        per_page: 10,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.current_page).toBe(1);
      expect(result.data.some((s: any) => s.id === createdStudentId)).toBe(true);
    });

    it('TC-STU-02: Should search students by name or user_code', async () => {
      const result = await studentsService.findAll({
        search: createdStudentCode,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data[0].user_code).toBe(createdStudentCode);
    });

    it('TC-STU-03: Should retrieve student details by ID', async () => {
      const result = await studentsService.findOne(createdStudentId, {
        id: testAdminId,
        role_type: RoleType.admin,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdStudentId);
      expect(result.data.user_code).toBe(createdStudentCode);
    });

    it('TC-STU-06: Should update student details successfully', async () => {
      const updateDto = {
        full_name: `طارق الورفلي المحدث-${uniqueSuffix}`,
        phone: '0922222222',
        birth_date: '2015-08-15',
        gender: Gender.male,
      };

      const result = await studentsService.update(createdStudentId, updateDto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم تحديث بيانات ملف الطالب');
      expect(result.data.full_name).toBe(updateDto.full_name);
    });

    it('TC-STU-06b: Should update student placement and safely handle existing or soft-deleted enrollment', async () => {
      // 1. Assign student to class_section
      const placeResult = await studentsService.update(
        createdStudentId,
        {
          class_section_id: testClassSectionId,
          seating_number: 'SEAT-TEST-01',
        },
        testAdminId,
      );
      expect(placeResult.success).toBe(true);

      // Verify placement via findOne
      const detail1 = await studentsService.findOne(createdStudentId);
      expect(detail1.data.class_section_id).toBe(testClassSectionId);
      expect(detail1.data.seating_number).toBe('SEAT-TEST-01');

      // 2. Soft-delete the enrollment to simulate previous deletion
      await prisma.studentEnrollment.updateMany({
        where: {
          student_id: BigInt(createdStudentId),
          academic_year_id: BigInt(testYearId),
        },
        data: { deleted_at: new Date() },
      });

      // 3. Update again with new seating_number and section -> must NOT fail with 500 uq_student_year_enrollment
      const restoreResult = await studentsService.update(
        createdStudentId,
        {
          class_section_id: testClassSectionId,
          seating_number: 'SEAT-TEST-02',
        },
        testAdminId,
      );
      expect(restoreResult.success).toBe(true);

      // Verify it was restored with deleted_at = null
      const detail2 = await studentsService.findOne(createdStudentId);
      expect(detail2.data.class_section_id).toBe(testClassSectionId);
      expect(detail2.data.seating_number).toBe('SEAT-TEST-02');

      // Cleanup enrollment so TC-STU-07 / delete tests can manage their own state
      await prisma.studentEnrollment.deleteMany({
        where: { student_id: BigInt(createdStudentId) },
      });
    });

    it('TC-STU-07: Should reject deleting student when active enrollments or parents exist (RESTRICT)', async () => {
      // Add enrollment to block deletion
      const enrollment = await prisma.studentEnrollment.create({
        data: {
          student_id: BigInt(createdStudentId),
          academic_year_id: BigInt(testYearId),
          class_id: BigInt(testClassId),
          class_section_id: BigInt(testClassSectionId),
          grade_level: 5,
          status: 'enrolled',
        },
      });

      await expect(
        studentsService.delete(createdStudentId, testAdminId),
      ).rejects.toThrow(ConflictException);

      // Remove enrollment so future operations can proceed
      await prisma.studentEnrollment.delete({ where: { id: enrollment.id } });
    });

    it('TC-STU-08: Should soft delete unlinked student and deactivate user account', async () => {
      // Create temporary student to delete
      const temp = await studentsService.create(
        {
          full_name: `طالب مؤقت-${uniqueSuffix}`,
          gender: Gender.female,
          password: 'Password123!',
        },
        testAdminId,
      );

      const deleteResult = await studentsService.delete(temp.data.id, testAdminId);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toContain('تم حذف ملف الطالب');

      // Verify soft delete in DB
      const deletedStudent = await prisma.student.findUnique({
        where: { id: BigInt(temp.data.id) },
      });
      expect(deletedStudent?.deleted_at).not.toBeNull();

      // Cleanup student and user
      await prisma.student.deleteMany({ where: { id: BigInt(temp.data.id) } });
      await prisma.user.deleteMany({ where: { id: BigInt(temp.data.user_id) } });
    });
  });

  // --------------------------------------------------------------------------
  // STEP 2: GUARDIANS REGISTRY (TC-GRD-01 -> TC-GRD-07)
  // --------------------------------------------------------------------------
  describe('Step 2: Guardians Management (guardians)', () => {
    const guardianPhone = `0915${uniqueSuffix.slice(-6)}`;

    it('TC-GRD-03: Should create guardian and atomically generate PAR-XXXX user code', async () => {
      const dto = {
        full_name: `خالد مسعود السويح-${uniqueSuffix}`,
        phone: guardianPhone,
        relationship: GuardianRelationship.father,
        password: 'Password123!',
      };

      const result = await guardiansService.create(dto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم إنشاء ملف ولي الأمر');
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.user_code).toMatch(/^PAR-\d+$/);
      expect(result.data.phone).toBe(guardianPhone);

      createdGuardianId = result.data.id;
      createdGuardianUserId = result.data.user_id;
      createdGuardianCode = result.data.user_code;

      // Verify User in DB
      const user = await prisma.user.findUnique({
        where: { id: BigInt(createdGuardianUserId) },
      });
      expect(user).toBeDefined();
      expect(user?.role_type).toBe(RoleType.parent);
      expect(user?.is_active).toBe(1);
    });

    it('TC-GRD-04: Should enforce unique guardian phone (uq_guardians_phone)', async () => {
      const duplicateDto = {
        full_name: `ولي أمر مكرر-${uniqueSuffix}`,
        phone: guardianPhone,
        relationship: GuardianRelationship.brother,
        password: 'Password123!',
      };

      await expect(guardiansService.create(duplicateDto, testAdminId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('TC-GRD-01: Should retrieve list of guardians with pagination and search', async () => {
      const result = await guardiansService.findAll({
        search: guardianPhone,
        page: 1,
        per_page: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data[0].phone).toBe(guardianPhone);
    });

    it('TC-GRD-02: Should retrieve guardian details by ID', async () => {
      const result = await guardiansService.findOne(createdGuardianId, {
        id: testAdminId,
        role_type: RoleType.admin,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdGuardianId);
      expect(result.data.user_code).toBe(createdGuardianCode);
    });

    it('TC-GRD-05: Should update guardian details successfully', async () => {
      const updateDto = {
        full_name: `خالد مسعود السويح المحدث-${uniqueSuffix}`,
        phone: guardianPhone,
        relationship: GuardianRelationship.father,
      };

      const result = await guardiansService.update(createdGuardianId, updateDto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم تحديث ملف ولي الأمر');
      expect(result.data.full_name).toBe(updateDto.full_name);
    });

    it('TC-GRD-07: Should soft delete unlinked guardian and user account', async () => {
      // Create temporary guardian to delete
      const tempPhone = `0919${uniqueSuffix.slice(-6)}`;
      const temp = await guardiansService.create(
        {
          full_name: `ولي أمر مؤقت-${uniqueSuffix}`,
          phone: tempPhone,
          relationship: GuardianRelationship.uncle,
          password: 'Password123!',
        },
        testAdminId,
      );

      const deleteResult = await guardiansService.delete(temp.data.id, testAdminId);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toContain('تم حذف ملف ولي الأمر');

      // Verify soft delete
      const deletedGrd = await prisma.guardian.findUnique({
        where: { id: BigInt(temp.data.id) },
      });
      expect(deletedGrd?.deleted_at).not.toBeNull();

      // Cleanup guardian and user
      await prisma.guardian.deleteMany({ where: { id: BigInt(temp.data.id) } });
      await prisma.user.deleteMany({ where: { id: BigInt(temp.data.user_id) } });
    });
  });

  // --------------------------------------------------------------------------
  // STEP 3: GUARDIAN-STUDENT CUSTODY (TC-CST-01 -> TC-CST-05)
  // --------------------------------------------------------------------------
  describe('Step 3: Guardian-Student Custody Relations (guardian_students)', () => {
    it('TC-CST-02: Should link guardian to student with is_primary flag', async () => {
      const dto = {
        guardian_id: createdGuardianId,
        student_id: createdStudentId,
        is_primary: 1,
      };

      const result = await guardianStudentsService.create(dto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم ربط وصاية ولي الأمر بالطالب بنجاح');
      expect(result.data).toBeDefined();
      expect(result.data.guardian_id).toBe(createdGuardianId);
      expect(result.data.student_id).toBe(createdStudentId);
      expect(result.data.is_primary).toBe(1);

      createdCustodyId = result.data.id;
    });

    it('TC-CST-03: Should reject duplicate guardian-student link (uq_guardian_student)', async () => {
      const duplicateDto = {
        guardian_id: createdGuardianId,
        student_id: createdStudentId,
        is_primary: 0,
      };

      await expect(guardianStudentsService.create(duplicateDto, testAdminId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('TC-CST-01: Should retrieve guardian children list', async () => {
      const result = await guardiansService.getStudents(createdGuardianId, {
        id: testAdminId,
        role_type: RoleType.admin,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].student_id).toBe(createdStudentId);
      expect(result.data[0].student_code).toBe(createdStudentCode);
    });

    it('TC-CST-04: Should update custody link (change is_primary)', async () => {
      const updateDto = {
        guardian_id: createdGuardianId,
        student_id: createdStudentId,
        is_primary: 0,
      };

      const result = await guardianStudentsService.update(createdCustodyId, updateDto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.data.is_primary).toBe(0);
    });

    it('TC-GRD-06: Should prevent deleting guardian when active custody link exists (RESTRICT)', async () => {
      await expect(guardiansService.delete(createdGuardianId, testAdminId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('TC-CST-05: Should remove custody link (soft delete)', async () => {
      const result = await guardianStudentsService.delete(createdCustodyId, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('تم فك وإلغاء رابط الوصاية');

      // Verify soft delete
      const deletedCustody = await prisma.guardianStudent.findUnique({
        where: { id: BigInt(createdCustodyId) },
      });
      expect(deletedCustody?.deleted_at).not.toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // SECURITY & RBAC TESTS (TC-RBAC-01 -> TC-RBAC-03, TC-AUDIT-01)
  // --------------------------------------------------------------------------
  describe('Security, RBAC & Scoping Tests', () => {
    it('TC-RBAC-01: Student should only access own profile, forbidden on others', async () => {
      // Mock student user
      const studentUser = {
        id: createdStudentUserId,
        role_type: RoleType.student,
      };

      // Allowed on own profile
      const ownResult = await studentsService.findOne(createdStudentId, studentUser);
      expect(ownResult.success).toBe(true);

      // Forbidden on other ID
      await expect(studentsService.findOne(99999, studentUser)).rejects.toThrow();
    });

    it('TC-RBAC-02: Parent should only access own children list, forbidden on other parents', async () => {
      const parentUser = {
        id: createdGuardianUserId,
        role_type: RoleType.parent,
      };

      // Allowed on own
      const ownKids = await guardiansService.getStudents(createdGuardianId, parentUser);
      expect(ownKids.success).toBe(true);

      // Forbidden on another guardian ID
      await expect(guardiansService.getStudents(99999, parentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('TC-AUDIT-01: Actions should be documented in audit_logs', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          user_id: BigInt(testAdminId),
        },
        orderBy: { id: 'desc' },
        take: 5,
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(
        logs.some(
          (l) =>
            l.action.includes('student') ||
            l.action.includes('guardian') ||
            l.action.includes('custody'),
        ),
      ).toBe(true);
    });
  });
});
