import AdmZip from 'adm-zip';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function executeLargeSql(sqlContent: string): Promise<void> {
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0;');

  // Sanitize double-quoted decimal numbers produced by previous Decimal.js serialization bug: '"50"' -> '50'
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

  console.log(`Executing ${statements.length} SQL statements...`);
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;
    await prisma.$executeRawUnsafe(trimmed);
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1;');
  console.log('✓ All SQL statements executed successfully!');
}

async function testRestore() {
  const zipPath = path.resolve(process.cwd(), 'storage/backups/full/backup_2026-09-28_12-19-16_full.zip');
  const zip = new AdmZip(zipPath);
  const sql = zip.readAsText('database.sql');
  await executeLargeSql(sql);
}

testRestore()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
