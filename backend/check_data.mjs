import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const years = await prisma.academicYear.findMany({
    select: { id: true, name: true, deleted_at: true },
  });
  const stages = await prisma.academicStage.findMany({
    select: { id: true, name: true, deleted_at: true },
  });
  const terms = await prisma.academicTerm.findMany({
    select: { id: true, name: true, deleted_at: true },
  });
  const classes = await prisma.class.findMany({
    select: { id: true, name: true, deleted_at: true },
  });

  console.log('YEARS:', JSON.stringify(years, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
  console.log('STAGES:', JSON.stringify(stages, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
  console.log('TERMS:', JSON.stringify(terms, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
  console.log('CLASSES:', JSON.stringify(classes, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});
