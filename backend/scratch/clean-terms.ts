import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terms = await prisma.academicTerm.findMany();
  console.log('Terms in DB:', terms);

  // Clean up any test terms where name starts with DelTerm or TestTerm or term_number > 20
  const deleted = await prisma.academicTerm.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'DelTerm' } },
        { name: { startsWith: 'TestTerm' } },
        { term_number: { gt: 10 } },
      ],
    },
  });
  console.log('Cleaned up test terms:', deleted);

  const remaining = await prisma.academicTerm.findMany();
  console.log('Remaining terms:', remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
