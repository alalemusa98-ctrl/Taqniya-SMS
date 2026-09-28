import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Updating Grade 1: All 3 Terms are 100% Coursework (No Exam) ===');

  const grade1 = await prisma.class.findFirst({
    where: { grade_level: 1, name: { not: 'التمهيدي' } },
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
  });

  if (!grade1) {
    console.error('Grade 1 not found');
    return;
  }

  const scoresByTerm: Record<number, Record<string, number>> = {
    1: { 'التربية الإسلامية': 36, 'اللغة العربية': 72, 'اللغة الإنجليزية': 36, 'الحاسوب': 12, 'الرياضيات': 60 },
    2: { 'التربية الإسلامية': 36, 'اللغة العربية': 72, 'اللغة الإنجليزية': 36, 'الحاسوب': 12, 'الرياضيات': 60 },
    3: { 'التربية الإسلامية': 48, 'اللغة العربية': 96, 'اللغة الإنجليزية': 48, 'الحاسوب': 16, 'الرياضيات': 80 },
  };

  for (const ct of grade1.class_academic_terms) {
    const termNum = ct.academic_term.term_number;
    const termMap = scoresByTerm[termNum];
    if (!termMap) continue;

    console.log(`\nUpdating Term #${termNum} (${ct.academic_term.name}, ID: ${ct.id}):`);

    for (const cs of ct.class_subjects) {
      const score = termMap[cs.subject.name];
      if (score !== undefined) {
        await prisma.classSubject.update({
          where: { id: cs.id },
          data: {
            max_score: score,
            max_coursework_score: score, // 100% اعمال سنة
            max_exam_score: 0.0,         // صفر امتحان نهائي
            exam_passing_score: 0.0,
            passing_score: score * 0.5,
          },
        });
        console.log(`  ✓ [100% أعمال سنة] ${cs.subject.name}: عظمى=${score} (أعمال سنة=${score}، امتحان=0، صغرى=${score * 0.5})`);
      }
    }
  }

  console.log('\n=== COMPLETED SUCCESSFULLY ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
