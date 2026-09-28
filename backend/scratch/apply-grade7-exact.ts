import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Configuring Grade 7 (الصف الأول الإعدادي / السابع) ===');

  const grade7 = await prisma.class.findFirst({
    where: {
      OR: [{ grade_level: 7 }, { name: { contains: 'السابع' } }, { name: { contains: 'الأول الإعدادي' } }],
      deleted_at: null,
    },
  });

  if (!grade7) {
    console.error('Grade 7 class not found!');
    return;
  }

  console.log(`Found Class: "${grade7.name}" (Grade: ${grade7.grade_level}, ID: ${grade7.id})`);

  const subjectsDef = [
    { name: 'التربية الإسلامية', code: 'ISLAM', periods: 2, totalMax: 80, totalCw: 32, totalExam: 48, pass: 40 },
    { name: 'اللغة العربية', code: 'ARAB', periods: 4, totalMax: 160, totalCw: 64, totalExam: 96, pass: 80 },
    { name: 'الكتابة', code: 'WRITING', altName: 'الكتابة (الإملاء والخط والتعبير)', periods: 2, totalMax: 80, totalCw: 32, totalExam: 48, pass: 40 },
    { name: 'اللغة الإنجليزية', code: 'ENG', periods: 4, totalMax: 160, totalCw: 64, totalExam: 96, pass: 80 },
    { name: 'الحاسوب', code: 'IT', periods: 2, totalMax: 80, totalCw: 32, totalExam: 48, pass: 40 },
    { name: 'الرياضيات', code: 'MATH', periods: 5, totalMax: 200, totalCw: 80, totalExam: 120, pass: 100 },
    { name: 'العلوم', code: 'SCI', periods: 4, totalMax: 160, totalCw: 64, totalExam: 96, pass: 80 },
    { name: 'التاريخ', code: 'HIST', periods: 2, totalMax: 80, totalCw: 32, totalExam: 48, pass: 40 },
    { name: 'الجغرافيا', code: 'GEO', periods: 2, totalMax: 80, totalCw: 32, totalExam: 48, pass: 40 },
  ];

  const subjectMap = new Map<string, bigint>();

  for (const s of subjectsDef) {
    let sub = await prisma.subject.findFirst({
      where: {
        OR: [
          { name: s.name },
          { name: s.altName || s.name },
          { code: s.code },
        ],
        deleted_at: null,
      },
    });

    if (!sub) {
      sub = await prisma.subject.create({
        data: { name: s.name, code: s.code },
      });
      console.log(`+ Created Subject: "${s.name}" (Code: ${s.code}, ID: ${sub.id})`);
    } else {
      console.log(`✓ Found Subject: "${sub.name}" (Code: ${sub.code}, ID: ${sub.id})`);
    }
    subjectMap.set(s.name, sub.id);
  }

  const classTerms = await prisma.classAcademicTerm.findMany({
    where: {
      class_id: grade7.id,
      deleted_at: null,
    },
    include: {
      academic_term: true,
    },
    orderBy: {
      academic_term: { term_number: 'asc' },
    },
  });

  const allowedSubjectNames = subjectsDef.map((s) => s.name);
  if (subjectsDef.some((s) => s.altName)) {
    allowedSubjectNames.push(...subjectsDef.filter((s) => s.altName).map((s) => s.altName!));
  }

  for (const ct of classTerms) {
    console.log(`\nConfiguring Term "${ct.academic_term.name}" (#${ct.academic_term.term_number}, ID: ${ct.id}):`);

    for (const s of subjectsDef) {
      const subId = subjectMap.get(s.name)!;
      // Per semester values
      const termMax = s.totalMax / 2;
      const termCw = s.totalCw / 2;
      const termExam = s.totalExam / 2;
      const termPass = s.pass / 2;

      const existingCs = await prisma.classSubject.findFirst({
        where: {
          class_academic_term_id: ct.id,
          subject_id: subId,
        },
      });

      if (existingCs) {
        await prisma.classSubject.update({
          where: { id: existingCs.id },
          data: {
            max_score: termMax,
            max_coursework_score: termCw,
            max_exam_score: termExam,
            exam_passing_score: termExam * 0.5,
            passing_score: termPass,
            deleted_at: null,
          },
        });
        console.log(`  ✓ ${s.name}: فصل=${termMax} (أعمال=${termCw}, امتحان=${termExam}, صغرى=${termPass})`);
      } else {
        await prisma.classSubject.create({
          data: {
            class_id: grade7.id,
            subject_id: subId,
            class_academic_term_id: ct.id,
            max_score: termMax,
            max_coursework_score: termCw,
            max_exam_score: termExam,
            exam_passing_score: termExam * 0.5,
            passing_score: termPass,
          },
        });
        console.log(`  + [CREATED] ${s.name}: فصل=${termMax} (أعمال=${termCw}, امتحان=${termExam}, صغرى=${termPass})`);
      }
    }

    // Soft-delete extra subjects if any
    const extraSubjects = await prisma.classSubject.findMany({
      where: {
        class_academic_term_id: ct.id,
        deleted_at: null,
        subject: {
          name: { notIn: allowedSubjectNames },
        },
      },
      include: { subject: true },
    });

    for (const ex of extraSubjects) {
      await prisma.classSubject.update({
        where: { id: ex.id },
        data: { deleted_at: new Date() },
      });
      console.log(`  - [REMOVED] ${ex.subject.name} (ID: ${ex.id})`);
    }
  }

  console.log('\n=== GRADE 7 CONFIGURATION COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
