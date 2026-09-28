import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM class_subjects LIMIT 1;');
  const row = rows[0];
  console.log('--- Inspecting class_subjects row ---');
  for (const [k, v] of Object.entries(row)) {
    console.log(
      k,
      '| typeof:', typeof v,
      '| constructor:', (v as any)?.constructor?.name,
      '| isDecimal?:', typeof (v as any)?.toFixed === 'function',
      '| val:', v
    );
  }
}

main().finally(() => prisma.$disconnect());
