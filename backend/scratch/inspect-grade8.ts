import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const g8 = await prisma.class.findFirst({
    where: { grade_level: 8, deleted_at: null },
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

  console.log('Grade 8 Class:', g8?.name, 'ID:', g8?.id);
  if (g8) {
    for (const ct of g8.class_academic_terms) {
      const termTotal = ct.class_subjects.reduce((sum, s) => sum + Number(s.max_score), 0);
      const cwTotal = ct.class_subjects.reduce((sum, s) => sum + Number(s.max_coursework_score), 0);
      const examTotal = ct.class_subjects.reduce((sum, s) => sum + Number(s.max_exam_score), 0);
      console.log(`\nTerm: ${ct.academic_term.name} (#${ct.academic_term.term_number}) -> ${ct.class_subjects.length} مواد | مجموع: ${termTotal} (أعمال: ${cwTotal}, امتحان: ${examTotal})`);
      for (const cs of ct.class_subjects) {
        console.log(`  - ${cs.subject.name}: max=${cs.max_score}, cw=${cs.max_coursework_score}, exam=${cs.max_exam_score}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
