import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const classTerms = await prisma.classAcademicTerm.findMany({
    where: { deleted_at: null },
    include: {
      class: true,
      academic_term: true,
    },
    orderBy: [
      { class: { grade_level: 'asc' } },
      { academic_term: { term_number: 'asc' } },
      { id: 'asc' },
    ],
  });

  console.log('=== Class Academic Terms Audit ===');
  for (const ct of classTerms) {
    console.log(
      `ID: ${ct.id} | Class: "${ct.class.name}" (Grade ${ct.class.grade_level}) | Term: "${ct.academic_term.name}" (#${ct.academic_term.term_number}) | is_active: ${ct.is_active} | is_closed: ${ct.is_closed}`
    );
  }
}

main().finally(() => prisma.$disconnect());
