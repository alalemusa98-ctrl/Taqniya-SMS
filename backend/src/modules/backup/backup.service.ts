import { Injectable, NotFoundException, BadRequestException, UnprocessableEntityException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { CreateBackupDto, BackupType } from './dto/create-backup.dto.js';

export interface BackupItem {
  filename: string;
  type: BackupType;
  size: string;
  size_bytes: number;
  created_at: string;
  note: string | null;
}

export interface UploadedMulterFile {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  buffer: Buffer;
  size?: number;
}

export interface BackupSummary {
  total_backups: number;
  total_size: string;
  full_count: number;
  database_count: number;
  files_count: number;
  storage_directory: string;
}

@Injectable()
export class BackupService {
  private baseBackupDir: string;
  private uploadsDir: string;
  private readonly validTypes: BackupType[] = ['full', 'database', 'files'];

  constructor(private readonly prisma: PrismaService) {
    this.baseBackupDir = path.resolve(process.cwd(), 'storage', 'backups');
    this.uploadsDir = path.resolve(process.cwd(), 'storage', 'uploads');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.baseBackupDir)) {
      fs.mkdirSync(this.baseBackupDir, { recursive: true });
    }
    for (const type of this.validTypes) {
      const typeDir = path.join(this.baseBackupDir, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }
    }
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
  }

  private parseDateFromFilename(filename: string, filePath?: string): string {
    const match = filename.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]} ${match[2]}:${match[3]}:${match[4]}`;
    }
    if (filePath && fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      return new Date(stat.mtime).toISOString().replace('T', ' ').substring(0, 19);
    }
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  private detectTypeFromFilename(filename: string): BackupType {
    if (filename.includes('_database')) return 'database';
    if (filename.includes('_files')) return 'files';
    return 'full';
  }

  private addDirectoryRecursive(dirPath: string, zip: AdmZip, zipBasePath: string): void {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.posix.join(zipBasePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.addDirectoryRecursive(fullPath, zip, relativePath);
      } else {
        const content = fs.readFileSync(fullPath);
        zip.addFile(relativePath, content);
      }
    }
  }

  private copyDirectoryRecursive(src: string, dest: string): void {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Find existing backup file location across all type directories or root
   */
  private findBackupFile(filename: string): { filePath: string; type: BackupType } | null {
    const safeFilename = path.basename(filename);

    for (const type of this.validTypes) {
      const filePath = path.join(this.baseBackupDir, type, safeFilename);
      if (fs.existsSync(filePath)) {
        return { filePath, type };
      }
    }

    // Root fallback for older backups
    const rootPath = path.join(this.baseBackupDir, safeFilename);
    if (fs.existsSync(rootPath)) {
      return { filePath: rootPath, type: this.detectTypeFromFilename(safeFilename) };
    }

    return null;
  }

  async listBackups(filterType?: BackupType): Promise<{ summary: BackupSummary; backups: BackupItem[] }> {
    this.ensureDirectories();

    let totalBytes = 0;
    let fullCount = 0;
    let databaseCount = 0;
    let filesCount = 0;
    const backups: BackupItem[] = [];

    // Scan all type subdirectories
    for (const type of this.validTypes) {
      const typeDir = path.join(this.baseBackupDir, type);
      if (fs.existsSync(typeDir)) {
        const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.zip'));

        for (const filename of files) {
          const filePath = path.join(typeDir, filename);
          const stat = fs.statSync(filePath);
          totalBytes += stat.size;

          if (type === 'full') fullCount++;
          else if (type === 'database') databaseCount++;
          else if (type === 'files') filesCount++;

          let note: string | null = null;
          try {
            const zip = new AdmZip(filePath);
            const noteEntry = zip.getEntry('note.txt');
            if (noteEntry) {
              note = zip.readAsText(noteEntry).trim();
            }
          } catch (err) {
            // Ignore corrupted zip note read
          }

          backups.push({
            filename,
            type,
            size: this.formatBytes(stat.size),
            size_bytes: stat.size,
            created_at: this.parseDateFromFilename(filename, filePath),
            note: note || null,
          });
        }
      }
    }

    // Scan root backups dir for backward compatibility
    const rootFiles = fs.readdirSync(this.baseBackupDir).filter(f => f.endsWith('.zip'));
    for (const filename of rootFiles) {
      const filePath = path.join(this.baseBackupDir, filename);
      const stat = fs.statSync(filePath);
      const type = this.detectTypeFromFilename(filename);
      totalBytes += stat.size;

      if (type === 'full') fullCount++;
      else if (type === 'database') databaseCount++;
      else if (type === 'files') filesCount++;

      let note: string | null = null;
      try {
        const zip = new AdmZip(filePath);
        const noteEntry = zip.getEntry('note.txt');
        if (noteEntry) {
          note = zip.readAsText(noteEntry).trim();
        }
      } catch (err) {
        // Ignore note error
      }

      backups.push({
        filename,
        type,
        size: this.formatBytes(stat.size),
        size_bytes: stat.size,
        created_at: this.parseDateFromFilename(filename, filePath),
        note: note || null,
      });
    }

    // Sort descending by creation date
    backups.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const filteredBackups = filterType ? backups.filter(b => b.type === filterType) : backups;

    return {
      summary: {
        total_backups: backups.length,
        total_size: this.formatBytes(totalBytes),
        full_count: fullCount,
        database_count: databaseCount,
        files_count: filesCount,
        storage_directory: this.baseBackupDir,
      },
      backups: filteredBackups,
    };
  }

  async createBackup(dto: CreateBackupDto = {}): Promise<BackupItem> {
    this.ensureDirectories();
    const type: BackupType = dto.type || 'full';
    const note = dto.note;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `backup_${timestamp}_${type}.zip`;
    const targetDir = path.join(this.baseBackupDir, type);
    const zipPath = path.join(targetDir, filename);
    const tempSqlPath = path.join(this.baseBackupDir, `temp_${timestamp}.sql`);

    try {
      const zip = new AdmZip();

      // 1. Dump database SQL if type is 'full' or 'database'
      if (type === 'full' || type === 'database') {
        const sqlStream = fs.createWriteStream(tempSqlPath, { encoding: 'utf8' });

        sqlStream.write(`-- ========================================================\n`);
        sqlStream.write(`-- Taqniya SMS Database Backup (${type.toUpperCase()})\n`);
        sqlStream.write(`-- Archive: ${filename}\n`);
        sqlStream.write(`-- Generated: ${now.toISOString()}\n`);
        sqlStream.write(`-- ========================================================\n\n`);
        sqlStream.write(`SET FOREIGN_KEY_CHECKS=0;\n\n`);

        const tableRows: any[] = await this.prisma.$queryRawUnsafe('SHOW TABLES;');
        const tables: string[] = tableRows.map((r: any) => Object.values(r)[0] as string);

        for (const table of tables) {
          const createResult: any[] = await this.prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${table}\`;`);
          if (createResult.length > 0) {
            const createSql = createResult[0]['Create Table'] || Object.values(createResult[0])[1];
            sqlStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
            sqlStream.write(`${createSql};\n\n`);
          }

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
                    if (typeof val === 'number' || typeof val === 'bigint') return val.toString();
                    if (typeof val === 'boolean') return val ? '1' : '0';
                    if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                    if (
                      typeof val === 'object' &&
                      val !== null &&
                      (val.constructor?.name === 'Decimal' ||
                        typeof (val as any).toFixed === 'function' ||
                        typeof (val as any).toNumber === 'function')
                    ) {
                      return val.toString();
                    }
                    if (Buffer.isBuffer(val)) {
                      return `X'${val.toString('hex')}'`;
                    }
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

        zip.addLocalFile(tempSqlPath, '', 'database.sql');
      }

      // 2. Add uploaded files if type is 'full' or 'files'
      if (type === 'full' || type === 'files') {
        if (fs.existsSync(this.uploadsDir)) {
          this.addDirectoryRecursive(this.uploadsDir, zip, 'storage');
        }
      }

      // 3. Add note if provided
      const trimmedNote = (note || '').trim();
      if (trimmedNote !== '') {
        zip.addFile('note.txt', Buffer.from(trimmedNote, 'utf8'));
      }

      // 4. Save ZIP archive
      zip.writeZip(zipPath);

      // Clean temp SQL
      if (fs.existsSync(tempSqlPath)) {
        fs.unlinkSync(tempSqlPath);
      }

      const stat = fs.statSync(zipPath);
      return {
        filename,
        type,
        size: this.formatBytes(stat.size),
        size_bytes: stat.size,
        created_at: this.parseDateFromFilename(filename, zipPath),
        note: trimmedNote !== '' ? trimmedNote : null,
      };
    } catch (error: any) {
      if (fs.existsSync(tempSqlPath)) {
        fs.unlinkSync(tempSqlPath);
      }
      throw new InternalServerErrorException(`تعذر إنشاء النسخة الاحتياطية: ${error.message}`);
    }
  }

  async uploadBackup(file: UploadedMulterFile): Promise<BackupItem> {
    this.ensureDirectories();
    if (!file || !file.buffer) {
      throw new BadRequestException('يجب تقديم ملف مضغوط صالح بصيغة ZIP.');
    }

    try {
      const zip = new AdmZip(file.buffer);
      const sqlEntry = zip.getEntry('database.sql');
      const storageEntry = zip.getEntries().find(e => e.entryName.startsWith('storage/'));

      if (!sqlEntry && !storageEntry) {
        throw new UnprocessableEntityException('ملف الأرشيف المضغوط غير صالح؛ يجب أن يحتوي على database.sql أو مجلد storage/ للملفات.');
      }

      const originalName = file.originalname || '';
      let detectedType: BackupType = 'full';

      if (sqlEntry && !storageEntry) {
        detectedType = 'database';
      } else if (!sqlEntry && storageEntry) {
        detectedType = 'files';
      } else {
        detectedType = this.detectTypeFromFilename(originalName);
      }

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      let targetName = originalName;

      if (!targetName.match(/^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_(full|database|files)\.zip$/)) {
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        targetName = `backup_${timestamp}_${detectedType}.zip`;
      }

      const targetPath = path.join(this.baseBackupDir, detectedType, targetName);
      fs.writeFileSync(targetPath, file.buffer);

      let note: string | null = null;
      const noteEntry = zip.getEntry('note.txt');
      if (noteEntry) {
        note = zip.readAsText(noteEntry).trim();
      }

      const stat = fs.statSync(targetPath);
      return {
        filename: targetName,
        type: detectedType,
        size: this.formatBytes(stat.size),
        size_bytes: stat.size,
        created_at: this.parseDateFromFilename(targetName, targetPath),
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
    this.ensureDirectories();
    const found = this.findBackupFile(filename);

    if (!found) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود.');
    }

    const tempExtractDir = path.join(this.baseBackupDir, `restore_temp_${Date.now()}`);

    try {
      const zip = new AdmZip(found.filePath);
      zip.extractAllTo(tempExtractDir, true);

      const sqlPath = path.join(tempExtractDir, 'database.sql');
      const storageExtractPath = path.join(tempExtractDir, 'storage');

      if (!fs.existsSync(sqlPath) && !fs.existsSync(storageExtractPath)) {
        throw new UnprocessableEntityException('الأرشيف المضغوط لا يحتوي على ملف قاعدة بيانات database.sql أو مجلد storage سليم.');
      }

      // 1. Restore database if SQL dump exists
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        await this.executeLargeSql(sqlContent);
      }

      // 2. Restore storage files if extracted storage folder exists
      if (fs.existsSync(storageExtractPath)) {
        this.copyDirectoryRecursive(storageExtractPath, this.uploadsDir);
      }

      return {
        filename: path.basename(found.filePath),
        restored_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new UnprocessableEntityException(`فشلت استعادة النسخة الاحتياطية: ${error.message}`);
    } finally {
      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      }
    }
  }

  private async executeLargeSql(sqlContent: string): Promise<void> {
    await this.prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');

    // Auto-sanitize legacy double-quoted decimal numbers from older backup versions: '"50"' -> '50'
    const sanitizedSql = sqlContent.replace(/'"(-?\d+(?:\.\d+)?)"'/g, "'$1'");

    const statements: string[] = [];
    let current = '';
    let inString = false;
    let strChar = '';
    const len = sanitizedSql.length;

    for (let i = 0; i < len; i++) {
      const char = sanitizedSql[i];

      if (inString) {
        current += char;
        if (char === '\\') {
          current += sanitizedSql[++i] || '';
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
    this.ensureDirectories();
    const found = this.findBackupFile(filename);

    if (!found) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود.');
    }

    return found.filePath;
  }

  async deleteBackup(filename: string): Promise<{ filename: string; deleted_at: string }> {
    this.ensureDirectories();
    const found = this.findBackupFile(filename);

    if (!found) {
      throw new NotFoundException('ملف النسخة الاحتياطية غير موجود أو تم حذفه مسبقاً.');
    }

    fs.unlinkSync(found.filePath);

    return {
      filename: path.basename(found.filePath),
      deleted_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  }
}
