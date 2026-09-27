import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface StoredAttachment {
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  url: string;
}

@Injectable()
export class StorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'storage', 'uploads');
    this.ensureUploadsDir();
  }

  private ensureUploadsDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, '_');
  }

  /**
   * Process and save attachments array for a given entity
   */
  async saveAttachments(
    entityType: 'assignments' | 'quizzes' | 'official_exams' | 'submissions',
    entityId: number | string,
    rawAttachments: any[],
  ): Promise<StoredAttachment[]> {
    if (!rawAttachments || !Array.isArray(rawAttachments)) {
      return [];
    }

    this.ensureUploadsDir();
    const entityDir = path.join(this.uploadsDir, entityType, String(entityId));
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
    }

    const storedAttachments: StoredAttachment[] = [];

    for (const item of rawAttachments) {
      if (!item) continue;

      const rawUrl: string = item.url || item.file_url || '';
      const rawName: string = item.name || item.file_name || 'attachment';
      const cleanName = this.sanitizeFilename(rawName);

      // 1. If attachment is a Base64 Data URL (e.g. data:image/png;base64,....)
      if (rawUrl.startsWith('data:') && rawUrl.includes(';base64,')) {
        const matches = rawUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const targetFilePath = path.join(entityDir, cleanName);
          fs.writeFileSync(targetFilePath, buffer);

          const relativePath = path.posix.join(entityType, String(entityId), cleanName);
          const storageUrl = `/api/v1/storage/${relativePath}`;
          storedAttachments.push({
            file_name: rawName,
            file_path: relativePath,
            file_size: buffer.length,
            file_type: mimeType,
            url: storageUrl,
            file_url: storageUrl,
          } as any);
          continue;
        }
      }

      // 2. If already saved relative path (e.g. file_path: "assignments/45/doc.pdf")
      if (item.file_path && typeof item.file_path === 'string') {
        const relativePath = item.file_path.replace(/\\/g, '/');
        const storageUrl = item.url || item.file_url || `/api/v1/storage/${relativePath}`;
        storedAttachments.push({
          file_name: rawName,
          file_path: relativePath,
          file_size: Number(item.file_size || item.size || 0),
          file_type: item.file_type || item.type || 'application/octet-stream',
          url: storageUrl,
          file_url: storageUrl,
        } as any);
        continue;
      }

      // 3. If raw URL is already a storage API path
      if (rawUrl.includes('/api/v1/storage/')) {
        const relativePath = rawUrl.split('/api/v1/storage/')[1];
        storedAttachments.push({
          file_name: rawName,
          file_path: relativePath,
          file_size: Number(item.file_size || item.size || 0),
          file_type: item.file_type || item.type || 'application/octet-stream',
          url: rawUrl,
          file_url: rawUrl,
        } as any);
        continue;
      }

      // 4. Any other URL or attachment object (e.g. external links or pre-uploaded references)
      storedAttachments.push({
        file_name: rawName,
        file_path: item.file_path || '',
        file_size: Number(item.file_size || item.size || 0),
        file_type: item.file_type || item.type || 'application/octet-stream',
        url: rawUrl,
        file_url: rawUrl,
      } as any);
    }

    return storedAttachments;
  }

  /**
   * Delete an entity's folder when deleted
   */
  async deleteEntityFolder(entityType: string, entityId: number | string): Promise<void> {
    const cleanEntityType = path.basename(entityType);
    const cleanEntityId = path.basename(String(entityId));
    const targetFolder = path.join(this.uploadsDir, cleanEntityType, cleanEntityId);

    if (fs.existsSync(targetFolder)) {
      fs.rmSync(targetFolder, { recursive: true, force: true });
    }
  }

  /**
   * Resolve safe file path and prevent directory traversal
   */
  getFilePath(relativePath: string): { fullPath: string; filename: string } {
    this.ensureUploadsDir();

    // Prevent directory traversal
    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    if (normalized.includes('..') || path.isAbsolute(normalized)) {
      throw new BadRequestException('مسار الملف غير صالح أو غير مسموح به.');
    }

    const fullPath = path.join(this.uploadsDir, normalized);

    // Verify it is inside uploadsDir
    if (!fullPath.startsWith(this.uploadsDir) || !fs.existsSync(fullPath)) {
      throw new NotFoundException('الملف المطلوب غير موجود بالسيرفر.');
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      throw new BadRequestException('المسار المحدد ليس ملفاً صالحاً.');
    }

    return {
      fullPath,
      filename: path.basename(fullPath),
    };
  }
}
