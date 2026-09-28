import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [1, 2, 3, 4, 5, 6, 7, 8] },
      name: { not: 'التمهيدي' },
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
        orderBy: { academic_term: { term_number: 'asc' } },
      },
    },
    orderBy: { grade_level: 'asc' },
  });

  console.log('=== Inspecting Term 2 Status Across All Grades ===\n');

  for (const cls of classes) {
    console.log(`🏫 Class: "${cls.name}" (Grade ${cls.grade_level})`);
    for (const ct of cls.class_academic_terms) {
      console.log(
        `   - Term: "${ct.academic_term.name}" (#${ct.academic_term.term_number}, ID: ${ct.id}) | is_active: ${ct.is_active} | is_closed: ${ct.is_closed} | Subjects: ${ct.class_subjects.length}`
      );
      if (ct.class_subjects.length > 0) {
        const subNames = ct.class_subjects.map(cs => `${cs.subject.name} (Max:${cs.max_score}, CW:${cs.max_coursework_score}, Ex:${cs.max_exam_score})`);
        console.log(`     * Subjects: ${subNames.join(' | ')}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
