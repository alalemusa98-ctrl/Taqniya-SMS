import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './modules/backup/backup.service.js';
import { BackupController } from './modules/backup/backup.controller.js';
import { PrismaService } from './common/prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';

describe('Phase 10: Backups & Disaster Recovery (TDD)', () => {
  let service: BackupService;
  let controller: BackupController;
  let prisma: PrismaService;
  const testStorageDir = path.resolve(process.cwd(), 'storage', 'backups_test');

  const mockPrismaService = {
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  };

  beforeEach(async () => {
    if (!fs.existsSync(testStorageDir)) {
      fs.mkdirSync(testStorageDir, { recursive: true });
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        BackupService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    service = module.get<BackupService>(BackupService);
    controller = module.get<BackupController>(BackupController);
    prisma = module.get<PrismaService>(PrismaService);

    // Override internal storage dir to test dir
    (service as any).storageDir = testStorageDir;
  });

  afterEach(() => {
    // Clean up test storage directory
    if (fs.existsSync(testStorageDir)) {
      const files = fs.readdirSync(testStorageDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testStorageDir, file));
      }
      fs.rmdirSync(testStorageDir);
    }
    vi.clearAllMocks();
  });

  it('TC-BCK-01: listBackups should return summary and list of backups', async () => {
    // Create a dummy zip backup in test directory
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SET FOREIGN_KEY_CHECKS=0;\n-- Test SQL\nSET FOREIGN_KEY_CHECKS=1;'));
    zip.addFile('note.txt', Buffer.from('ملاحظة تجريبية للنسخة'));
    const dummyFilename = 'backup_2026-09-26_22-30-00_database.zip';
    zip.writeZip(path.join(testStorageDir, dummyFilename));

    const result = await controller.listBackups();

    expect(result.success).toBe(true);
    expect(result.data.summary.total_backups).toBe(1);
    expect(result.data.backups.length).toBe(1);
    expect(result.data.backups[0].filename).toBe(dummyFilename);
    expect(result.data.backups[0].note).toBe('ملاحظة تجريبية للنسخة');
    expect(result.data.backups[0].created_at).toBe('2026-09-26 22:30:00');
  });

  it('TC-BCK-02: createBackup should export database and pack into zip with note', async () => {
    // Mock database tables and data
    mockPrismaService.$queryRawUnsafe.mockImplementation(async (query: string) => {
      if (query === 'SHOW TABLES;') {
        return [{ Tables_in_taqniya_sms: 'users' }, { Tables_in_taqniya_sms: 'roles' }];
      }
      if (query.includes('SHOW CREATE TABLE `users`')) {
        return [{ Table: 'users', 'Create Table': 'CREATE TABLE `users` (`id` varchar(191) NOT NULL, PRIMARY KEY (`id`))' }];
      }
      if (query.includes('SHOW CREATE TABLE `roles`')) {
        return [{ Table: 'roles', 'Create Table': 'CREATE TABLE `roles` (`id` varchar(191) NOT NULL, PRIMARY KEY (`id`))' }];
      }
      if (query.includes('SELECT COUNT(*) as count FROM `users`')) {
        return [{ count: 1n }];
      }
      if (query.includes('SELECT COUNT(*) as count FROM `roles`')) {
        return [{ count: 0n }];
      }
      if (query.includes('SELECT * FROM `users` LIMIT')) {
        return [{ id: 'usr_admin_1' }];
      }
      return [];
    });

    const result = await controller.createBackup({ note: 'نسخة ما قبل التحديث' });

    expect(result.success).toBe(true);
    expect(result.message).toContain('تم إنشاء النسخة الاحتياطية بنجاح');
    expect(result.data.note).toBe('نسخة ما قبل التحديث');
    expect(result.data.filename).toMatch(/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_database\.zip$/);

    // Verify zip content on disk
    const zipPath = path.join(testStorageDir, result.data.filename);
    expect(fs.existsSync(zipPath)).toBe(true);

    const zip = new AdmZip(zipPath);
    const sqlEntry = zip.getEntry('database.sql');
    const noteEntry = zip.getEntry('note.txt');

    expect(sqlEntry).toBeDefined();
    expect(noteEntry).toBeDefined();
    expect(zip.readAsText(noteEntry!)).toBe('نسخة ما قبل التحديث');

    const sqlContent = zip.readAsText(sqlEntry!);
    expect(sqlContent).toContain('SET FOREIGN_KEY_CHECKS=0;');
    expect(sqlContent).toContain('DROP TABLE IF EXISTS `users`;');
    expect(sqlContent).toContain('CREATE TABLE `users`');
    expect(sqlContent).toContain('INSERT INTO `users`');
    expect(sqlContent).toContain('SET FOREIGN_KEY_CHECKS=1;');
  });

  it('TC-BCK-03: deleteBackup should remove file from storage', async () => {
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SET FOREIGN_KEY_CHECKS=0;'));
    const filename = 'backup_2026-09-26_10-00-00_database.zip';
    zip.writeZip(path.join(testStorageDir, filename));

    expect(fs.existsSync(path.join(testStorageDir, filename))).toBe(true);

    const result = await controller.deleteBackup(filename);

    expect(result.success).toBe(true);
    expect(result.message).toContain('تم حذف النسخة الاحتياطية');
    expect(fs.existsSync(path.join(testStorageDir, filename))).toBe(false);
  });

  it('TC-BCK-04: deleteBackup on non-existent file should throw 404', async () => {
    await expect(controller.deleteBackup('non_existent.zip')).rejects.toThrow();
  });

  it('TC-BCK-05: uploadBackup should validate and store external zip file', async () => {
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SET FOREIGN_KEY_CHECKS=0;\nCREATE TABLE `test` (`id` int);\nSET FOREIGN_KEY_CHECKS=1;'));
    zip.addFile('note.txt', Buffer.from('نسخة مرفوعة'));
    const zipBuffer = zip.toBuffer();

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'custom_backup_external.zip',
      encoding: '7bit',
      mimetype: 'application/zip',
      buffer: zipBuffer,
      size: zipBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const result = await controller.uploadBackup(mockFile);

    expect(result.success).toBe(true);
    expect(result.message).toContain('تم رفع النسخة الاحتياطية بنجاح');
    expect(result.data.note).toBe('نسخة مرفوعة');
    expect(fs.existsSync(path.join(testStorageDir, result.data.filename))).toBe(true);
  });

  it('TC-BCK-06: restoreBackup should execute SQL script with foreign key checks isolated', async () => {
    const zip = new AdmZip();
    const sqlCommands = `
      SET FOREIGN_KEY_CHECKS=0;
      DROP TABLE IF EXISTS \`users\`;
      CREATE TABLE \`users\` (\`id\` VARCHAR(191) PRIMARY KEY);
      INSERT INTO \`users\` (\`id\`) VALUES ('usr_100');
      SET FOREIGN_KEY_CHECKS=1;
    `;
    zip.addFile('database.sql', Buffer.from(sqlCommands));
    const filename = 'backup_2026-09-26_23-00-00_database.zip';
    zip.writeZip(path.join(testStorageDir, filename));

    mockPrismaService.$executeRawUnsafe.mockResolvedValue(1);

    const result = await controller.restoreBackup(filename);

    expect(result.success).toBe(true);
    expect(result.message).toContain('تمت استعادة قاعدة البيانات');
    expect(mockPrismaService.$executeRawUnsafe).toHaveBeenCalled();
  });
});
