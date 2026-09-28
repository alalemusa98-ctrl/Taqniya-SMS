import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Step 1: Ensure All Subjects From the Official Table Exist ===');

  const officialSubjects = [
    { name: 'التربية الإسلامية', code: 'ISLAM', max_score: 120, cw: 72, exam: 48, pass: 48, exPass: 0 },
    { name: 'اللغة العربية', code: 'ARAB', max_score: 160, cw: 96, exam: 64, pass: 64, exPass: 0 },
    { name: 'الكتابة (الإملاء والخط والتعبير)', code: 'WRITING', max_score: 80, cw: 48, exam: 32, pass: 32, exPass: 0 },
    { name: 'اللغة الإنجليزية', code: 'ENG', max_score: 120, cw: 72, exam: 48, pass: 48, exPass: 0 },
    { name: 'الحاسوب', code: 'IT', max_score: 40, cw: 24, exam: 16, pass: 16, exPass: 0 },
    { name: 'الرياضيات', code: 'MATH', max_score: 200, cw: 120, exam: 80, pass: 80, exPass: 0 },
    { name: 'العلوم', code: 'SCI', max_score: 120, cw: 72, exam: 48, pass: 48, exPass: 0 },
    { name: 'الاجتماعيات', code: 'SOCIAL', max_score: 80, cw: 48, exam: 32, pass: 32, exPass: 0 },
  ];

  const subjectMap = new Map<string, bigint>();

  for (const s of officialSubjects) {
    let sub = await prisma.subject.findFirst({
      where: {
        OR: [{ name: s.name }, { code: s.code }],
        deleted_at: null,
      },
    });

    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          name: s.name,
          code: s.code,
        },
      });
      console.log(`+ Created new Subject: "${s.name}" (Code: ${s.code}, ID: ${sub.id})`);
    } else {
      console.log(`✓ Existing Subject: "${sub.name}" (Code: ${sub.code}, ID: ${sub.id})`);
    }
    subjectMap.set(s.name, sub.id);
  }

  console.log('\n=== Step 2: Applying Exact Curriculum & Scores to Grade 4 & Grade 5 ===');

  const targetClasses = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [4, 5] },
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

  const officialSubjectNames = officialSubjects.map((s) => s.name);

  for (const cls of targetClasses) {
    console.log(`\n========================================`);
    console.log(`Class: ${cls.name} (Grade Level: ${cls.grade_level}, ID: ${cls.id})`);
    console.log(`========================================`);

    for (const term of cls.class_academic_terms) {
      console.log(`\n  -> Term: "${term.academic_term.name}" (ClassAcademicTerm ID: ${term.id})`);

      for (const s of officialSubjects) {
        const subId = subjectMap.get(s.name);
        if (!subId) continue;

        const existingCs = await prisma.classSubject.findFirst({
          where: {
            class_academic_term_id: term.id,
            subject_id: subId,
            deleted_at: null,
          },
        });

        if (existingCs) {
          await prisma.classSubject.update({
            where: { id: existingCs.id },
            data: {
              max_score: s.max_score,
              max_coursework_score: s.cw,
              max_exam_score: s.exam,
              exam_passing_score: s.exPass,
              passing_score: s.pass,
            },
          });
          console.log(`     [UPDATED] ${s.name}: Max=${s.max_score}, الفترتين=${s.cw}, الامتحان=${s.exam}, شرط النجاح=${s.pass}`);
        } else {
          await prisma.classSubject.create({
            data: {
              class_id: cls.id,
              subject_id: subId,
              class_academic_term_id: term.id,
              max_score: s.max_score,
              max_coursework_score: s.cw,
              max_exam_score: s.exam,
              exam_passing_score: s.exPass,
              passing_score: s.pass,
            },
          });
          console.log(`     [CREATED] ${s.name}: Max=${s.max_score}, الفترتين=${s.cw}, الامتحان=${s.exam}, شرط النجاح=${s.pass}`);
        }
      }

      // Soft delete subjects not in the official list (e.g. separated history/geography if merged into social studies, etc.)
      const extraSubjects = await prisma.classSubject.findMany({
        where: {
          class_academic_term_id: term.id,
          deleted_at: null,
          subject: {
            name: { notIn: officialSubjectNames },
          },
        },
        include: { subject: true },
      });

      for (const extra of extraSubjects) {
        await prisma.classSubject.update({
          where: { id: extra.id },
          data: { deleted_at: new Date() },
        });
        console.log(`     [REMOVED EXTRA] ${extra.subject.name} removed to match official document.`);
      }
    }
  }

  console.log('\n=== COMPLETED SUCCESSFULLY ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
