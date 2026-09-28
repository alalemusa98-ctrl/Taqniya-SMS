import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Normalizing Class Academic Terms Active State ===\n');

  const classes = await prisma.class.findMany({
    where: { deleted_at: null },
    include: {
      class_academic_terms: {
        where: { deleted_at: null },
        include: { academic_term: true },
        orderBy: { academic_term: { term_number: 'asc' } },
      },
    },
    orderBy: { grade_level: 'asc' },
  });

  for (const cls of classes) {
    console.log(`🏫 Class: "${cls.name}" (Grade ${cls.grade_level}) — Terms count: ${cls.class_academic_terms.length}`);

    for (let i = 0; i < cls.class_academic_terms.length; i++) {
      const ct = cls.class_academic_terms[i];
      const shouldBeActive = ct.academic_term.term_number === 1 ? 1 : 0;

      if (ct.is_active !== shouldBeActive) {
        await prisma.classAcademicTerm.update({
          where: { id: ct.id },
          data: { is_active: shouldBeActive },
        });
        console.log(`   ⚙️ [UPDATED] Term "${ct.academic_term.name}" (#${ct.academic_term.term_number}) -> is_active = ${shouldBeActive}`);
      } else {
        console.log(`   ✓ [OK] Term "${ct.academic_term.name}" (#${ct.academic_term.term_number}) -> is_active = ${ct.is_active}`);
      }
    }
  }

  console.log('\n=== Verification Report ===');
  const allTerms = await prisma.classAcademicTerm.findMany({
    where: { deleted_at: null },
    include: { class: true, academic_term: true },
    orderBy: [{ class: { grade_level: 'asc' } }, { academic_term: { term_number: 'asc' } }],
  });

  for (const ct of allTerms) {
    if (ct.is_active === 1) {
      console.log(`🟢 ACTIVE: Class "${ct.class.name}" -> "${ct.academic_term.name}" (ID: ${ct.id})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
