import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const g6 = await prisma.class.findFirst({
    where: { grade_level: 6, deleted_at: null },
    include: {
      class_academic_terms: {
        where: { deleted_at: null },
        include: {
          academic_term: true,
          class_subjects: {
            where: { deleted_at: null },
            include: { subject: true },
          },
        },
      },
    },
  });

  console.log('Grade 6 Class:', g6?.name, 'ID:', g6?.id);
  if (g6) {
    for (const ct of g6.class_academic_terms) {
      console.log(`\nTerm: ${ct.academic_term.name} (#${ct.academic_term.term_number}, ID: ${ct.id})`);
      for (const cs of ct.class_subjects) {
        console.log(`  - ${cs.subject.name}: max=${cs.max_score}, cw=${cs.max_coursework_score}, exam=${cs.max_exam_score}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
