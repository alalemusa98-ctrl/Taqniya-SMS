import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BackupService, type UploadedMulterFile } from './modules/backup/backup.service.js';
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
  const testBaseBackupDir = path.resolve(process.cwd(), 'storage', 'backups_test_p10');
  const testUploadsDir = path.resolve(process.cwd(), 'storage', 'uploads_test_p10');

  const mockPrismaService = {
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  };

  beforeEach(async () => {
    if (!fs.existsSync(testBaseBackupDir)) {
      fs.mkdirSync(testBaseBackupDir, { recursive: true });
    }
    if (!fs.existsSync(testUploadsDir)) {
      fs.mkdirSync(testUploadsDir, { recursive: true });
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

    // Override internal directories to test directories
    (service as any).baseBackupDir = testBaseBackupDir;
    (service as any).uploadsDir = testUploadsDir;
    (service as any).ensureDirectories();
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testBaseBackupDir)) {
      fs.rmSync(testBaseBackupDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  it('TC-BCK-01: listBackups should return summary with type counts and list of backups', async () => {
    // Create dummy database backup
    const dbZip = new AdmZip();
    dbZip.addFile('database.sql', Buffer.from('SET FOREIGN_KEY_CHECKS=0;\n-- Test SQL\nSET FOREIGN_KEY_CHECKS=1;'));
    dbZip.addFile('note.txt', Buffer.from('ملاحظة تجريبية لقاعدة البيانات'));
    const dbFilename = 'backup_2026-09-26_22-30-00_database.zip';
    dbZip.writeZip(path.join(testBaseBackupDir, 'database', dbFilename));

    // Create dummy files backup
    const filesZip = new AdmZip();
    filesZip.addFile('storage/assignments/1/doc.pdf', Buffer.from('PDF content'));
    filesZip.addFile('note.txt', Buffer.from('ملاحظة أرشفة الملفات'));
    const filesFilename = 'backup_2026-09-26_21-00-00_files.zip';
    filesZip.writeZip(path.join(testBaseBackupDir, 'files', filesFilename));

    const result = await controller.listBackups();

    expect(result.success).toBe(true);
    expect(result.data.summary.total_backups).toBe(2);
    expect(result.data.summary.database_count).toBe(1);
    expect(result.data.summary.files_count).toBe(1);
    expect(result.data.summary.full_count).toBe(0);
    expect(result.data.backups.length).toBe(2);

    // Filter by type
    const dbOnly = await controller.listBackups('database');
    expect(dbOnly.data.backups.length).toBe(1);
    expect(dbOnly.data.backups[0].type).toBe('database');
  });

  it('TC-BCK-02: createBackup with type database should export SQL only', async () => {
    mockPrismaService.$queryRawUnsafe.mockImplementation(async (query: string) => {
      if (query === 'SHOW TABLES;') {
        return [{ Tables_in_taqniya_sms: 'users' }];
      }
      if (query.includes('SHOW CREATE TABLE `users`')) {
        return [{ Table: 'users', 'Create Table': 'CREATE TABLE `users` (`id` varchar(191) NOT NULL, PRIMARY KEY (`id`))' }];
      }
      if (query.includes('SELECT COUNT(*) as count FROM `users`')) {
        return [{ count: 1n }];
      }
      if (query.includes('SELECT * FROM `users` LIMIT')) {
        return [{ id: 'usr_admin_1' }];
      }
      return [];
    });

    const result = await controller.createBackup({ type: 'database', note: 'نسخة قاعدة بيانات خفيفة' });

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('database');
    expect(result.data.note).toBe('نسخة قاعدة بيانات خفيفة');
    expect(result.data.filename).toMatch(/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_database\.zip$/);

    const zipPath = path.join(testBaseBackupDir, 'database', result.data.filename);
    expect(fs.existsSync(zipPath)).toBe(true);

    const zip = new AdmZip(zipPath);
    expect(zip.getEntry('database.sql')).toBeDefined();
    expect(zip.getEntry('note.txt')).toBeDefined();
    expect(zip.getEntries().find(e => e.entryName.startsWith('storage/'))).toBeUndefined();
  });

  it('TC-BCK-03: createBackup with type files should pack uploaded files only', async () => {
    // Create dummy files in uploadsDir
    const assignmentDir = path.join(testUploadsDir, 'assignments', '15');
    fs.mkdirSync(assignmentDir, { recursive: true });
    fs.writeFileSync(path.join(assignmentDir, 'homework1.pdf'), 'Dummy PDF file content');

    const result = await controller.createBackup({ type: 'files', note: 'أرشفة المرفقات والواجبات' });

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('files');
    expect(result.data.note).toBe('أرشفة المرفقات والواجبات');
    expect(result.data.filename).toMatch(/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_files\.zip$/);

    const zipPath = path.join(testBaseBackupDir, 'files', result.data.filename);
    expect(fs.existsSync(zipPath)).toBe(true);

    const zip = new AdmZip(zipPath);
    expect(zip.getEntry('database.sql')).toBeNull();
    expect(zip.getEntry('note.txt')).toBeDefined();
    expect(zip.getEntry('storage/assignments/15/homework1.pdf')).toBeDefined();
  });

  it('TC-BCK-04: createBackup with type full should include both database.sql and storage files', async () => {
    mockPrismaService.$queryRawUnsafe.mockImplementation(async (query: string) => {
      if (query === 'SHOW TABLES;') return [{ Tables_in_taqniya_sms: 'classes' }];
      if (query.includes('SHOW CREATE TABLE `classes`')) {
        return [{ Table: 'classes', 'Create Table': 'CREATE TABLE `classes` (`id` int)' }];
      }
      if (query.includes('SELECT COUNT(*) as count FROM `classes`')) return [{ count: 0n }];
      return [];
    });

    const quizDir = path.join(testUploadsDir, 'quizzes', '8');
    fs.mkdirSync(quizDir, { recursive: true });
    fs.writeFileSync(path.join(quizDir, 'quiz.docx'), 'Quiz docx content');

    const result = await controller.createBackup({ type: 'full', note: 'نسخة شاملة للنظام' });

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('full');

    const zipPath = path.join(testBaseBackupDir, 'full', result.data.filename);
    const zip = new AdmZip(zipPath);
    expect(zip.getEntry('database.sql')).toBeDefined();
    expect(zip.getEntry('storage/quizzes/8/quiz.docx')).toBeDefined();
    expect(zip.getEntry('note.txt')).toBeDefined();
  });

  it('TC-BCK-05: deleteBackup should remove file from appropriate type directory', async () => {
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SET FOREIGN_KEY_CHECKS=0;'));
    const filename = 'backup_2026-09-26_10-00-00_database.zip';
    const filePath = path.join(testBaseBackupDir, 'database', filename);
    zip.writeZip(filePath);

    expect(fs.existsSync(filePath)).toBe(true);

    const result = await controller.deleteBackup(filename);

    expect(result.success).toBe(true);
    expect(result.message).toContain('تم حذف النسخة الاحتياطية');
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('TC-BCK-06: deleteBackup on non-existent file should throw 404', async () => {
    await expect(controller.deleteBackup('non_existent.zip')).rejects.toThrow();
  });

  it('TC-BCK-07: uploadBackup should auto-detect type and save to corresponding directory', async () => {
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from('SET FOREIGN_KEY_CHECKS=0;\nCREATE TABLE `test` (`id` int);\nSET FOREIGN_KEY_CHECKS=1;'));
    zip.addFile('note.txt', Buffer.from('نسخة قاعدة بيانات مرفوعة'));
    const zipBuffer = zip.toBuffer();

    const mockFile: UploadedMulterFile = {
      fieldname: 'file',
      originalname: 'custom_backup_database.zip',
      encoding: '7bit',
      mimetype: 'application/zip',
      buffer: zipBuffer,
      size: zipBuffer.length,
    };

    const result = await controller.uploadBackup(mockFile);

    expect(result.success).toBe(true);
    expect(result.data.type).toBe('database');
    expect(result.data.note).toBe('نسخة قاعدة بيانات مرفوعة');
    expect(fs.existsSync(path.join(testBaseBackupDir, 'database', result.data.filename))).toBe(true);
  });

  it('TC-BCK-08: restoreBackup should execute SQL and extract storage files', async () => {
    const zip = new AdmZip();
    const sqlCommands = `
      SET FOREIGN_KEY_CHECKS=0;
      DROP TABLE IF EXISTS \`users\`;
      CREATE TABLE \`users\` (\`id\` VARCHAR(191) PRIMARY KEY);
      INSERT INTO \`users\` (\`id\`) VALUES ('usr_100');
      SET FOREIGN_KEY_CHECKS=1;
    `;
    zip.addFile('database.sql', Buffer.from(sqlCommands));
    zip.addFile('storage/exams/1/paper.pdf', Buffer.from('Restored PDF paper'));
    const filename = 'backup_2026-09-26_23-00-00_full.zip';
    zip.writeZip(path.join(testBaseBackupDir, 'full', filename));

    mockPrismaService.$executeRawUnsafe.mockResolvedValue(1);

    const result = await controller.restoreBackup(filename);

    expect(result.success).toBe(true);
    expect(result.message).toContain('تمت استعادة النسخة الاحتياطية');
    expect(mockPrismaService.$executeRawUnsafe).toHaveBeenCalled();
    expect(fs.existsSync(path.join(testUploadsDir, 'exams', '1', 'paper.pdf'))).toBe(true);
  });
});
