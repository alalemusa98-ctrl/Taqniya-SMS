import { Injectable, NotFoundException, BadRequestException, UnprocessableEntityException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

export interface BackupItem {
  filename: string;
  size: string;
  size_bytes: number;
  created_at: string;
  note: string | null;
}

export interface BackupSummary {
  total_backups: number;
  total_size: string;
  storage_directory: string;
}

@Injectable()
export class BackupService {
  private storageDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.storageDir = path.resolve(process.cwd(), 'storage', 'backups');
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
  }

  private parseDateFromFilename(filename: string): string {
    const match = filename.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]} ${match[2]}:${match[3]}:${match[4]}`;
    }
    const stat = fs.statSync(path.join(this.storageDir, filename));
    return new Date(stat.mtime).toISOString().replace('T', ' ').substring(0, 19);
  }

  async listBackups(): Promise<{ summary: BackupSummary; backups: BackupItem[] }> {
    this.ensureStorageDir();
    const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.zip'));

    let totalBytes = 0;
    const backups: BackupItem[] = [];

    for (const filename of files) {
      const filePath = path.join(this.storageDir, filename);
      const stat = fs.statSync(filePath);
      totalBytes += stat.size;

      let note: string | null = null;
      try {
        const zip = new AdmZip(filePath);
        const noteEntry = zip.getEntry('note.txt');
        if (noteEntry) {
          note = zip.readAsText(noteEntry).trim();
        }
      } catch (err) {
        // If zip reading fails, keep note as null
      }

      backups.push({
        filename,
        size: this.formatBytes(stat.size),
        size_bytes: stat.size,
        created_at: this.parseDateFromFilename(filename),
        note: note || null,
      });
    }

    // Sort descending by creation date
    backups.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return {
      summary: {
        total_backups: backups.length,
        total_size: this.formatBytes(totalBytes),
        storage_directory: this.storageDir,
      },
      backups,
    };
  }

  async createBackup(note?: string): Promise<BackupItem> {
    this.ensureStorageDir();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `backup_${timestamp}_database.zip`;
    const zipPath = path.join(this.storageDir, filename);
    const tempSqlPath = path.join(this.storageDir, `temp_${timestamp}.sql`);

    try {
      const sqlStream = fs.createWriteStream(tempSqlPath, { encoding: 'utf8' });

      sqlStream.write(`-- ========================================================\n`);
      sqlStream.write(`-- Taqniya SMS Database Backup\n`);
      sqlStream.write(`-- Archive: ${filename}\n`);
      sqlStream.write(`-- Generated: ${now.toISOString()}\n`);
      sqlStream.write(`-- ========================================================\n\n`);
      sqlStream.write(`SET FOREIGN_KEY_CHECKS=0;\n\n`);

      // 1. Fetch tables
      const tableRows: any[] = await this.prisma.$queryRawUnsafe('SHOW TABLES;');
      const tables: string[] = tableRows.map((r: any) => Object.values(r)[0] as string);

      for (const table of tables) {
        // DDL
        const createResult: any[] = await this.prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${table}\`;`);
        if (createResult.length > 0) {
          const createSql = createResult[0]['Create Table'] || Object.values(createResult[0])[1];
          sqlStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
          sqlStream.write(`${createSql};\n\n`);
        }

        // Data Chunking
        const countResult: any[] = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`${table}\`;`);
        const totalRows = Number(countResult[0]?.count || 0);

        if (totalRows > 0) {
          const chunkSize = 500;
          for (let offset = 0; offset < totalRows; offset += chunkSize) {
            const rows: any[] = await this.prisma.$queryRawUnsafe(
              `SELECT * FROM \`${table}\` LIMIT ${chunkSize} OFFSET ${offset};`,
            );

            if (rows.length > 0) {
              const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
              const valueRows: string[] = [];

              for (const row of rows) {
                const values = Object.values(row).map(val => {
                  if (val === null || val === undefined) return 'NULL';
                  if (typeof val === 'number') return val.toString();
                  if (typeof val === 'bigint') return val.toString();
                  if (typeof val === 'boolean') return val ? '1' : '0';
                  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                  if (typeof val === 'object') {
                    const jsonStr = JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    return `'${jsonStr}'`;
                  }
                  const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                  return `'${str}'`;
                });
                valueRows.push(`(${values.join(', ')})`);
              }

              sqlStream.write(`INSERT INTO \`${table}\` (${columns}) VALUES\n${valueRows.join(',\n')};\n\n`);
            }
          }
        }
      }

      sqlStream.write(`SET FOREIGN_KEY_CHECKS=1;\n`);
      await new Promise(resolve => sqlStream.end(resolve));

      // Create ZIP Archive
      const zip = new AdmZip();
      zip.addLocalFile(tempSqlPath, '', 'database.sql');

      const trimmedNote = (note || '').trim();
      if (trimmedNote !== '') {
        zip.addFile('note.txt', Buffer.from(trimmedNote, 'utf8'));
      }

      zip.writeZip(zipPath);

      // Clean temp SQL
      if (fs.existsSync(tempSqlPath)) {
        fs.unlinkSync(tempSqlPath);
      }

      const stat = fs.statSync(zipPath);
      return {
        filename,
        size: this.formatBytes(stat.size),
        size_bytes: stat.size,
        created_at: this.parseDateFromFilename(filename),
        note: trimmedNote !== '' ? trimmedNote : null,
      };
    } catch (error: any) {
      if (fs.existsSync(tempSqlPath)) {
        fs.unlinkSync(tempSqlPath);
      }
      throw new InternalServerErrorException(`تعذر إنشاء النسخة الاحتياطية لقاعدة البيانات: ${error.message}`);
    }
  }

  async uploadBackup(file: Express.Multer.File): Promise<BackupItem> {
    this.ensureStorageDir();
    if (!file || !file.buffer) {
      throw new BadRequestException('يجب تقديم ملف مضغوط صالح بصيغة ZIP.');
    }

    try {
      const zip = new AdmZip(file.buffer);
      const sqlEntry = zip.getEntry('database.sql');

      if (!sqlEntry) {
        throw new UnprocessableEntityException('ملف الأرشيف المضغوط غير صالح؛ يجب أن يحتوي على ملف database.sql.');
      }

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      let targetName = file.originalname || '';

      if (!targetName.match(/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_database\.zip$/)) {
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        targetName = `backup_${timestamp}_database.zip`;
      }

      const targetPath = path.join(this.storageDir, targetName);
      fs.writeFileSync(targetPath, file.buffer);

      let note: string | null = null;
      const noteEntry = zip.getEntry('note.txt');
      if (noteEntry) {
        note = zip.readAsText(noteEntry).trim();
      }

      const stat = fs.statSync(targetPath);
      return {
        filename: targetName,
        size: this.formatBytes(stat.size),
        size_bytes: stat.size,
        created_at: this.parseDateFromFilename(targetName),
        note: note || null,
      };
    } catch (error: any) {
      if (error instanceof UnprocessableEntityException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`فشل استيراد الملف المضغوط: ${error.message}`);
    }
  }

  async restoreBackup(filename: string): Promise<{ filename: string; restored_at: string }> {
    this.ensureStorageDir();
    const safeFilename = path.basename(filename);
    const zipPath = path.join(this.storageDir, safeFilename);

    if (!fs.existsSync(zipPath)) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود.');
    }

    const tempExtractDir = path.join(this.storageDir, `restore_temp_${Date.now()}`);

    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tempExtractDir, true);

      const sqlPath = path.join(tempExtractDir, 'database.sql');
      if (!fs.existsSync(sqlPath)) {
        throw new UnprocessableEntityException('الأرشيف المضغوط لا يحتوي على ملف database.sql سليم.');
      }

      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      await this.executeLargeSql(sqlContent);

      return {
        filename: safeFilename,
        restored_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new UnprocessableEntityException(`فشلت استعادة قاعدة البيانات: ${error.message}`);
    } finally {
      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      }
    }
  }

  private async executeLargeSql(sqlContent: string): Promise<void> {
    await this.prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');

    const statements: string[] = [];
    let current = '';
    let inString = false;
    let strChar = '';
    const len = sqlContent.length;

    for (let i = 0; i < len; i++) {
      const char = sqlContent[i];

      if (inString) {
        current += char;
        if (char === '\\') {
          current += sqlContent[++i] || '';
        } else if (char === strChar) {
          inString = false;
        }
      } else if (char === "'" || char === '"' || char === '`') {
        inString = true;
        strChar = char;
        current += char;
      } else if (char === ';') {
        const stmt = current.trim();
        if (stmt !== '' && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim() !== '' && !current.trim().startsWith('--')) {
      statements.push(current.trim());
    }

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;
      await this.prisma.$executeRawUnsafe(trimmed);
    }

    await this.prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  }

  getBackupFilePath(filename: string): string {
    this.ensureStorageDir();
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.storageDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود.');
    }

    return filePath;
  }

  async deleteBackup(filename: string): Promise<{ filename: string; deleted_at: string }> {
    this.ensureStorageDir();
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.storageDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود أو تم حذفه مسبقاً.');
    }

    fs.unlinkSync(filePath);

    return {
      filename: safeFilename,
      deleted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  }
}
