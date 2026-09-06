import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { TeachersService } from './modules/teachers/teachers.service.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 03-A: Teachers Profiles Registry (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let teachersService: TeachersService;
  let prisma: PrismaService;

  const testAdminId = 1;
  let createdTeacherId1: number;
  let createdUserId1: number;
  let createdUserCode1: string;

  let createdTeacherId2: number;
  let createdUserId2: number;

  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    teachersService = moduleRef.get<TeachersService>(TeachersService);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    // Ensure test admin user exists
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  describe('Group 1: Teacher Profile Creation & Atomic Account Generation', () => {
    it('TC-TCH-05: Creates teacher and atomically generates user account with TCH-XXXX', async () => {
      const dto = {
        full_name: `أحمد محمود سالم-${uniqueSuffix}`,
        phone: `091${uniqueSuffix}`,
        specialization: 'الرياضيات',
        hire_date: '2024-09-01',
        password: 'TeacherPassword123!',
      };

      const result = await teachersService.create(dto, testAdminId, '127.0.0.1', 'Vitest Agent');

      expect(result.success).toBe(true);
      expect(result.message).toBe('تم إنشاء ملف المعلم وتوليد حساب الدخول الموحد بنجاح.');
      expect(result.data.id).toBeDefined();
      expect(result.data.user_id).toBeDefined();
      expect(result.data.user_code).toMatch(/^TCH-\d+$/);
      expect(result.data.full_name).toBe(dto.full_name);
      expect(result.data.phone).toBe(dto.phone);
      expect(result.data.specialization).toBe(dto.specialization);

      createdTeacherId1 = result.data.id;
      createdUserId1 = result.data.user_id;
      createdUserCode1 = result.data.user_code;

      // Verify in DB directly
      const dbTeacher = await prisma.teacher.findUnique({
        where: { id: BigInt(createdTeacherId1) },
        include: { user: true },
      });
      expect(dbTeacher).toBeDefined();
      expect(dbTeacher?.deleted_at).toBeNull();
      expect(dbTeacher?.user.role_type).toBe(RoleType.teacher);
      expect(dbTeacher?.user.is_active).toBe(1);

      // Verify password hashed
      const isPasswordMatch = await bcrypt.compare(dto.password, dbTeacher!.user.password);
      expect(isPasswordMatch).toBe(true);
    });

    it('TC-TCH-06: Reject duplicate phone number on creation (409 Conflict)', async () => {
      const dtoDuplicate = {
        full_name: 'معلم مكرر الهاتف',
        phone: `091${uniqueSuffix}`, // Same as teacher 1
        specialization: 'الفيزياء',
        hire_date: '2024-09-01',
        password: 'Password123!',
      };

      await expect(
        teachersService.create(dtoDuplicate, testAdminId),
      ).rejects.toThrow(ConflictException);
    });

    it('Creates a second teacher for filtering and relation tests', async () => {
      const dto2 = {
        full_name: `خالد عبد السلام-${uniqueSuffix}`,
        phone: `092${uniqueSuffix}`,
        specialization: 'العلوم العامة',
        hire_date: '2023-01-15',
        password: 'TeacherPassword123!',
      };

      const result = await teachersService.create(dto2, testAdminId);
      expect(result.success).toBe(true);
      expect(result.data.user_code).toMatch(/^TCH-\d+$/);
      createdTeacherId2 = result.data.id;
      createdUserId2 = result.data.user_id;
    });
  });

  describe('Group 2: Listing, Filtering & Searching Teachers', () => {
    it('TC-TCH-01: List teachers with pagination and filter by specialization', async () => {
      const result = await teachersService.findAll({
        specialization: 'الرياضيات',
        page: 1,
        per_page: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.meta.total).toBeGreaterThanOrEqual(1);
      const found = result.data.find((t) => t.id === createdTeacherId1);
      expect(found).toBeDefined();
      expect(found?.specialization).toBe('الرياضيات');
    });

    it('TC-TCH-02: Search teachers by full_name or user_code', async () => {
      const searchByName = await teachersService.findAll({
        search: `أحمد محمود سالم-${uniqueSuffix}`,
      });
      expect(searchByName.data.length).toBe(1);
      expect(searchByName.data[0].id).toBe(createdTeacherId1);

      const searchByCode = await teachersService.findAll({
        search: createdUserCode1,
      });
      expect(searchByCode.data.length).toBe(1);
      expect(searchByCode.data[0].id).toBe(createdTeacherId1);
    });
  });

  describe('Group 3: Teacher Details & RBAC IDOR Scoping', () => {
    it('TC-TCH-03: Get teacher details by ID as admin', async () => {
      const result = await teachersService.findOne(createdTeacherId1, {
        id: testAdminId,
        role_type: RoleType.admin,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdTeacherId1);
      expect(result.data.user_code).toBe(createdUserCode1);
      expect(result.data.is_active).toBe(1);
    });

    it('TC-TCH-04: Negative: 404 when teacher ID does not exist', async () => {
      await expect(
        teachersService.findOne(999999, { id: testAdminId, role_type: RoleType.admin }),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-RBAC-03: Teacher can inspect their own profile', async () => {
      const result = await teachersService.findOne(createdTeacherId1, {
        id: createdUserId1,
        role_type: RoleType.teacher,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdTeacherId1);
    });

    it('TC-RBAC-02: Teacher is forbidden from inspecting another teacher profile (IDOR prevention)', async () => {
      await expect(
        teachersService.findOne(createdTeacherId2, {
          id: createdUserId1, // Teacher 1 attempting to view Teacher 2
          role_type: RoleType.teacher,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Group 4: Teacher Update & Phone Uniqueness', () => {
    it('TC-TCH-08: Update teacher details successfully', async () => {
      const updateDto = {
        full_name: `أحمد محمود سالم الورفلي-${uniqueSuffix}`,
        specialization: 'الرياضيات والفيزياء',
      };

      const result = await teachersService.update(createdTeacherId1, updateDto, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('تم تحديث بيانات ملف المعلم بنجاح.');
      expect(result.data.full_name).toBe(updateDto.full_name);
      expect(result.data.specialization).toBe(updateDto.specialization);
    });

    it('TC-TCH-09: Prevent update if new phone is used by another teacher (409 Conflict)', async () => {
      const duplicatePhoneDto = {
        phone: `092${uniqueSuffix}`, // Phone of teacher 2
      };

      await expect(
        teachersService.update(createdTeacherId1, duplicatePhoneDto, testAdminId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Group 5: Deletion & Relational Integrity (RESTRICT Protection)', () => {
    it('TC-TCH-10: Prevent delete of teacher assigned to teaching_assignments (RESTRICT)', async () => {
      // Create test academic year, stage, class, section, class_section, subject
      const academicYear = await prisma.academicYear.create({
        data: {
          name: `Year-${uniqueSuffix}`,
          start_date: new Date('2024-09-01'),
          end_date: new Date('2025-06-30'),
          is_active: 1,
        },
      });

      const stage = await prisma.academicStage.create({
        data: { name: `Stage-${uniqueSuffix}`, order_index: 99 },
      });

      const cls = await prisma.class.create({
        data: { stage_id: stage.id, name: `Class-${uniqueSuffix}`, grade_level: 1 },
      });

      const sec = await prisma.section.create({
        data: { name: `Sec-${uniqueSuffix}` },
      });

      const classSec = await prisma.classSection.create({
        data: { class_id: cls.id, section_id: sec.id },
      });

      const subj = await prisma.subject.create({
        data: { name: `Subj-${uniqueSuffix}`, code: `S-${uniqueSuffix}` },
      });

      // Assign teacher 1 to teaching_assignments
      await prisma.teachingAssignment.create({
        data: {
          academic_year_id: academicYear.id,
          class_section_id: classSec.id,
          subject_id: subj.id,
          teacher_id: BigInt(createdTeacherId1),
        },
      });

      // Attempt deletion -> MUST fail with ConflictException (RESTRICT)
      await expect(teachersService.delete(createdTeacherId1, testAdminId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('TC-TCH-11: Soft delete free teacher (without assignments)', async () => {
      const result = await teachersService.delete(createdTeacherId2, testAdminId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('تم حذف ملف المعلم وحسابه بنجاح.');

      // Check soft delete in DB
      const teacherInDb = await prisma.teacher.findUnique({
        where: { id: BigInt(createdTeacherId2) },
        include: { user: true },
      });

      expect(teacherInDb?.deleted_at).not.toBeNull();
      expect(teacherInDb?.user.deleted_at).not.toBeNull();
      expect(teacherInDb?.user.is_active).toBe(0);
    });
  });

  describe('Group 6: Audit Logging Verification', () => {
    it('TC-AUDIT-01: Verifies audit logs recorded for teacher operations', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          entity_type: 'Teacher',
          entity_id: BigInt(createdTeacherId1),
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      const actions = logs.map((l) => l.action);
      expect(actions).toContain('teacher_created');
      expect(actions).toContain('teacher_updated');
    });
  });
});
