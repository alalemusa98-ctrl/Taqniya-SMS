import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    where: { grade_level: { in: [1, 2, 3, 4, 5] }, deleted_at: null, name: { not: 'التمهيدي' } },
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

  for (const c of classes) {
    console.log(`\n======================================================`);
    console.log(`${c.name} (Grade ${c.grade_level})`);
    console.log(`======================================================`);
    let grandTotal = 0;
    for (const ct of c.class_academic_terms) {
      const termTotal = ct.class_subjects.reduce((sum, s) => sum + Number(s.max_score), 0);
      const cwTotal = ct.class_subjects.reduce((sum, s) => sum + Number(s.max_coursework_score), 0);
      const examTotal = ct.class_subjects.reduce((sum, s) => sum + Number(s.max_exam_score), 0);
      grandTotal += termTotal;
      console.log(`  Term: ${ct.academic_term.name} (#${ct.academic_term.term_number}) -> ${ct.class_subjects.length} مواد | مجموع: ${termTotal} (أعمال: ${cwTotal}, امتحان: ${examTotal})`);
      for (const cs of ct.class_subjects) {
        console.log(`     - ${cs.subject.name}: الدرجة=${cs.max_score} (أعمال=${cs.max_coursework_score}, امتحان=${cs.max_exam_score})`);
      }
    }
    console.log(`>>> المجموع الكلي النهائي للصف: ${grandTotal}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
