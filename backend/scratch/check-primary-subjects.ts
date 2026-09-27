import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const primaryClasses = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [1, 2, 3] },
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
    orderBy: { grade_level: 'asc' },
  });

  console.log('=== PRIMARY CLASSES (1, 2, 3) ===');
  for (const c of primaryClasses) {
    console.log(`Class: ${c.name} (id: ${c.id}, grade_level: ${c.grade_level})`);
    for (const ct of c.class_academic_terms) {
      console.log(`  Term: ${ct.academic_term.name} (class_term_id: ${ct.id})`);
      for (const cs of ct.class_subjects) {
        console.log(`    - Subject ID: ${cs.subject.id} (${cs.subject.name}), Max: ${cs.max_score}, Coursework: ${cs.max_coursework_score}, Exam: ${cs.max_exam_score}, Passing: ${cs.passing_score}, ExamPassing: ${cs.exam_passing_score}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
