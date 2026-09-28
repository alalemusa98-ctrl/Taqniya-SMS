import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Updating Grade 4 (الصف الرابع الابتدائي) Curriculum & Scores ===');

  const grade4Class = await prisma.class.findFirst({
    where: {
      deleted_at: null,
      grade_level: 4,
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

  if (!grade4Class) {
    console.error('Grade 4 class not found!');
    return;
  }

  console.log(`Found Class: ${grade4Class.name} (ID: ${grade4Class.id})`);

  const grade4SubjectList = [
    { name: 'التربية الإسلامية', code: 'ISLAM' },
    { name: 'اللغة العربية', code: 'ARAB' },
    { name: 'الرياضيات', code: 'MATH' },
    { name: 'العلوم', code: 'SCI' },
    { name: 'اللغة الإنجليزية', code: 'ENG' },
    { name: 'التاريخ', code: 'HIST' },
    { name: 'الجغرافيا', code: 'GEO' },
    { name: 'الحاسوب', code: 'IT' },
    { name: 'التربية البدنية', code: 'PE' },
    { name: 'التربية الفنية', code: 'ART' },
  ];

  const subjectMap = new Map<string, bigint>();

  for (const item of grade4SubjectList) {
    let sub = await prisma.subject.findFirst({
      where: {
        OR: [{ name: item.name }, { code: item.code }],
        deleted_at: null,
      },
    });

    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          name: item.name,
          code: item.code,
        },
      });
      console.log(`+ Created Subject: ${item.name} (ID: ${sub.id})`);
    } else {
      console.log(`✓ Subject Available: ${sub.name} (ID: ${sub.id})`);
    }
    subjectMap.set(item.name, sub.id);
  }

  for (const term of grade4Class.class_academic_terms) {
    console.log(`\nProcessing Term: ${term.academic_term.name} (ClassAcademicTerm ID: ${term.id})`);

    for (const item of grade4SubjectList) {
      const subId = subjectMap.get(item.name);
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
            max_score: 100.0,
            max_coursework_score: 40.0,
            max_exam_score: 60.0,
            exam_passing_score: 30.0,
            passing_score: 50.0,
          },
        });
        console.log(`  [UPDATED] ${item.name}: Max=100, Coursework=40, Exam=60, Passing=50, ExamPassing=30`);
      } else {
        await prisma.classSubject.create({
          data: {
            class_id: grade4Class.id,
            subject_id: subId,
            class_academic_term_id: term.id,
            max_score: 100.0,
            max_coursework_score: 40.0,
            max_exam_score: 60.0,
            exam_passing_score: 30.0,
            passing_score: 50.0,
          },
        });
        console.log(`  [CREATED] ${item.name}: Max=100, Coursework=40, Exam=60, Passing=50, ExamPassing=30`);
      }
    }
  }

  console.log('\n=== COMPLETED SUCCESSFULLY ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
