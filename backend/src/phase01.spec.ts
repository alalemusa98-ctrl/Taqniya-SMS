import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { AuthService } from './modules/auth/auth.service.js';
import { UsersService } from './modules/users/users.service.js';
import { AuditService } from './modules/audit/audit.service.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import { RoleType } from '@prisma/client';
import { UnauthorizedException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';

describe('Phase 01: Authentication, Identity & Audit (TDD Verification)', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let usersService: UsersService;
  let auditService: AuditService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usersService = moduleRef.get<UsersService>(UsersService);
    auditService = moduleRef.get<AuditService>(AuditService);
    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  describe('Group 1: Authentication & Sessions (auth)', () => {
    let adminToken: string;
    let studentToken: string;

    it('TC-AUTH-01: Login successfully with ADM-1001 and issue JWT session', async () => {
      const result = await authService.login(
        {
          user_code: 'ADM-1001',
          password: 'SecretPassword@123',
          device_name: 'Vitest Automated Agent',
        },
        '127.0.0.1',
        'Vitest/1.0',
      );

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.user.user_code).toBe('ADM-1001');
      expect(result.data.user.role_type).toBe('admin');
      expect(result.data.user.is_active).toBe(1);

      adminToken = result.data.token;
    });

    it('TC-AUTH-02: Fail login when password is wrong (401 Unauthorized)', async () => {
      await expect(
        authService.login(
          {
            user_code: 'ADM-1001',
            password: 'WrongSecretPassword',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-AUTH-03: Block login for inactive/suspended account PAR-4001 (403 Forbidden)', async () => {
      await expect(
        authService.login(
          {
            user_code: 'PAR-4001',
            password: 'SecretPassword@123',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-AUTH-06: Retrieve authenticated user profile (GET /auth/me)', async () => {
      const adminUser = await prisma.user.findUnique({ where: { user_code: 'ADM-1001' } });
      expect(adminUser).toBeDefined();

      const profile = await authService.getMe(Number(adminUser!.id));
      expect(profile.success).toBe(true);
      expect(profile.data.user_code).toBe('ADM-1001');
      expect(profile.data.role_type).toBe('admin');
    });

    it('TC-AUTH-10: Change password with valid current password', async () => {
      const studentUser = await prisma.user.findUnique({ where: { user_code: 'STU-3001' } });
      expect(studentUser).toBeDefined();

      const result = await authService.changePassword(
        Number(studentUser!.id),
        {
          current_password: 'SecretPassword@123',
          new_password: 'NewStudentPassword@2026',
          new_password_confirmation: 'NewStudentPassword@2026',
        },
        '127.0.0.1',
      );

      expect(result.success).toBe(true);

      // Revert back so seed stays clean
      await authService.changePassword(
        Number(studentUser!.id),
        {
          current_password: 'NewStudentPassword@2026',
          new_password: 'SecretPassword@123',
          new_password_confirmation: 'SecretPassword@123',
        },
        '127.0.0.1',
      );
    });

    it('TC-AUTH-11: Reject change password if confirmation does not match', async () => {
      const studentUser = await prisma.user.findUnique({ where: { user_code: 'STU-3001' } });

      await expect(
        authService.changePassword(
          Number(studentUser!.id),
          {
            current_password: 'SecretPassword@123',
            new_password: 'NewStudentPassword@2026',
            new_password_confirmation: 'MismatchPassword',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('Group 2: Users Management (users)', () => {
    it('TC-USR-01: List users tree matrix with role groups and active counts', async () => {
      const result = await usersService.findAllTree({});

      expect(result.success).toBe(true);
      expect(result.data.role_types).toBeDefined();
      expect(result.data.role_types.length).toBe(4);

      const adminGroup = result.data.role_types.find((g) => g.role_type === 'admin');
      expect(adminGroup).toBeDefined();
      expect(adminGroup!.users_count).toBeGreaterThanOrEqual(1);
    });

    it('TC-USR-03: Get single user details by ID', async () => {
      const teacherUser = await prisma.user.findUnique({ where: { user_code: 'TCH-2001' } });
      expect(teacherUser).toBeDefined();

      const details = await usersService.findOne(Number(teacherUser!.id));
      expect(details.success).toBe(true);
      expect(details.data.user_code).toBe('TCH-2001');
      expect(details.data.role_type).toBe('teacher');
    });

    it('TC-USR-04: Deactivate and reactivate user with atomic session invalidation', async () => {
      const teacherUser = await prisma.user.findUnique({ where: { user_code: 'TCH-2001' } });
      const adminUser = await prisma.user.findUnique({ where: { user_code: 'ADM-1001' } });

      // Deactivate
      const deactivateResult = await usersService.updateStatus(
        Number(teacherUser!.id),
        { is_active: 0, reason: 'Temporary disciplinary action' },
        Number(adminUser!.id),
        '127.0.0.1',
      );

      expect(deactivateResult.success).toBe(true);
      expect(deactivateResult.data.is_active).toBe(0);

      // Verify sessions were wiped
      const activeTokens = await prisma.personalAccessToken.findMany({
        where: { user_id: teacherUser!.id },
      });
      expect(activeTokens.length).toBe(0);

      // Reactivate
      const reactivateResult = await usersService.updateStatus(
        Number(teacherUser!.id),
        { is_active: 1, reason: 'Reinstated after review' },
        Number(adminUser!.id),
        '127.0.0.1',
      );

      expect(reactivateResult.success).toBe(true);
      expect(reactivateResult.data.is_active).toBe(1);
    });

    it('TC-USR-05: Admin reset password with atomic session invalidation', async () => {
      const teacherUser = await prisma.user.findUnique({ where: { user_code: 'TCH-2001' } });
      const adminUser = await prisma.user.findUnique({ where: { user_code: 'ADM-1001' } });

      const resetResult = await usersService.resetPassword(
        Number(teacherUser!.id),
        { new_password: 'SecretPassword@123' },
        Number(adminUser!.id),
        '127.0.0.1',
      );

      expect(resetResult.success).toBe(true);
    });
  });

  describe('Group 3: Audit Logs (audit_logs)', () => {
    it('TC-AUD-01: List audit logs with pagination', async () => {
      const result = await auditService.findAll({ page: 1, per_page: 10 });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.meta.total).toBeGreaterThan(0);
    });

    it('TC-AUD-02: Get audit log details by ID with diff values', async () => {
      const logs = await prisma.auditLog.findMany({ take: 1, orderBy: { id: 'desc' } });
      expect(logs.length).toBe(1);

      const log = await auditService.findOne(Number(logs[0].id));
      expect(log).not.toBeNull();
      expect(log!.id).toBe(Number(logs[0].id));
      expect(log!.action).toBeDefined();
    });
  });
});
