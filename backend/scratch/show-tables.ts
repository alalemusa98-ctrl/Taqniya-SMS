import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables: any[] = await prisma.$queryRawUnsafe('SHOW TABLES;');
  console.log('Tables in DB:', tables.map((t) => Object.values(t)[0]));
}

main().finally(() => prisma.$disconnect());
