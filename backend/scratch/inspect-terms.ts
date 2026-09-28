import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terms = await prisma.academicTerm.findMany({ where: { deleted_at: null } });
  console.log('=== ALL ACADEMIC TERMS IN DB ===');
  for (const t of terms) {
    console.log(`ID: ${t.id}, Name: ${t.name}, TermNumber: ${t.term_number}`);
  }

  const cls = await prisma.class.findFirst({
    where: { grade_level: 1, name: { not: 'التمهيدي' } },
    include: {
      class_academic_terms: {
        where: { deleted_at: null },
        include: { academic_term: true },
      },
    },
  });

  console.log('\n=== GRADE 1 CLASS & TERMS ===');
  console.log(`Class: ${cls?.name} (ID: ${cls?.id})`);
  for (const ct of cls?.class_academic_terms || []) {
    console.log(`  ClassTerm ID: ${ct.id}, Term: ${ct.academic_term.name} (Term ID: ${ct.academic_term_id})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
