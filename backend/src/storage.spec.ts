import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './modules/storage/storage.service.js';
import { StorageController } from './modules/storage/storage.controller.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import * as fs from 'fs';
import * as path from 'path';

describe('StorageModule: Hierarchical File Storage & Serving (TDD)', () => {
  let service: StorageService;
  let controller: StorageController;
  const testUploadsDir = path.resolve(process.cwd(), 'storage', 'uploads_test_storage_spec');

  beforeEach(async () => {
    if (!fs.existsSync(testUploadsDir)) {
      fs.mkdirSync(testUploadsDir, { recursive: true });
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [StorageService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    service = module.get<StorageService>(StorageService);
    controller = module.get<StorageController>(StorageController);

    // Override uploads dir to test directory
    (service as any).uploadsDir = testUploadsDir;
    (service as any).ensureUploadsDir();
  });

  afterEach(() => {
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
  });

  it('TC-STR-01: saveAttachments should decode base64 data URL and save to entity folder', async () => {
    const base64Data = Buffer.from('Hello world PDF sample content').toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64Data}`;

    const rawAttachments = [
      {
        name: 'homework_sheet.pdf',
        size: '30 B',
        type: 'application/pdf',
        url: dataUrl,
      },
    ];

    const result = await service.saveAttachments('assignments', 45, rawAttachments);

    expect(result.length).toBe(1);
    expect(result[0].file_name).toBe('homework_sheet.pdf');
    expect(result[0].file_path).toBe('assignments/45/homework_sheet.pdf');
    expect(result[0].file_type).toBe('application/pdf');
    expect(result[0].file_size).toBe(Buffer.from('Hello world PDF sample content').length);
    expect(result[0].url).toBe('/api/v1/storage/assignments/45/homework_sheet.pdf');

    // Verify physical file on disk
    const diskFilePath = path.join(testUploadsDir, 'assignments', '45', 'homework_sheet.pdf');
    expect(fs.existsSync(diskFilePath)).toBe(true);
    expect(fs.readFileSync(diskFilePath, 'utf8')).toBe('Hello world PDF sample content');
  });

  it('TC-STR-02: saveAttachments should preserve already stored attachment references', async () => {
    const existingAttachment = {
      file_name: 'existing_exam.pdf',
      file_path: 'official_exams/12/existing_exam.pdf',
      file_size: 1024,
      file_type: 'application/pdf',
      url: '/api/v1/storage/official_exams/12/existing_exam.pdf',
    };

    const result = await service.saveAttachments('official_exams', 12, [existingAttachment]);

    expect(result.length).toBe(1);
    expect(result[0].file_path).toBe('official_exams/12/existing_exam.pdf');
  });

  it('TC-STR-03: deleteEntityFolder should remove entity directory recursively', async () => {
    const folder = path.join(testUploadsDir, 'quizzes', '99');
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'quiz1.docx'), 'dummy');

    expect(fs.existsSync(folder)).toBe(true);

    await service.deleteEntityFolder('quizzes', 99);

    expect(fs.existsSync(folder)).toBe(false);
  });

  it('TC-STR-04: getFilePath should reject path traversal attempts', () => {
    expect(() => service.getFilePath('../../../etc/passwd')).toThrow();
    expect(() => service.getFilePath('assignments/../../secret.txt')).toThrow();
  });

  it('TC-STR-05: controller.serveFile should stream file with proper attachment headers', async () => {
    const filePath = path.join(testUploadsDir, 'assignments', '10', 'notes.txt');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'Important study notes');

    let sentFilePath = '';
    let sentFileName = '';
    const mockRes: any = {
      download: vi.fn((p: string, n: string) => {
        sentFilePath = p;
        sentFileName = n;
      }),
    };

    await controller.serveFile('assignments', '10', 'notes.txt', mockRes);

    expect(mockRes.download).toHaveBeenCalledWith(filePath, 'notes.txt');
    expect(sentFilePath).toBe(filePath);
    expect(sentFileName).toBe('notes.txt');
  });

  it('TC-STR-06: controller.serveFile should throw NotFoundException for non-existent file', async () => {
    const mockRes: any = {
      download: vi.fn(),
    };

    expect(() => controller.serveFile('assignments', '10', 'missing.txt', mockRes)).toThrow();
  });
});
