import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const g7 = await prisma.class.findFirst({
    where: {
      OR: [
        { grade_level: 7 },
        { name: { contains: 'السابع' } },
        { name: { contains: 'الأول الإعدادي' } },
        { name: { contains: 'الاول الاعدادي' } },
      ],
      deleted_at: null,
    },
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

  console.log('Grade 7 Class:', g7?.name, 'Grade Level:', g7?.grade_level, 'ID:', g7?.id);
  if (g7) {
    for (const ct of g7.class_academic_terms) {
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
