import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== STEP 1: Ensuring Subjects Exist in DB ===');

  const requiredSubjects = [
    { name: 'التربية الإسلامية', code: 'ISLAM' },
    { name: 'اللغة العربية', code: 'ARAB' },
    { name: 'الرياضيات', code: 'MATH' },
    { name: 'اللغة الإنجليزية', code: 'ENG' },
    { name: 'العلوم', code: 'SCI' },
    { name: 'التربية البدنية', code: 'PE' },
    { name: 'التربية الفنية', code: 'ART' },
  ];

  const subjectMap = new Map<string, bigint>();

  for (const item of requiredSubjects) {
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
      console.log(`+ Created new Subject: "${item.name}" (Code: ${item.code}, ID: ${sub.id})`);
    } else {
      console.log(`✓ Existing Subject: "${sub.name}" (Code: ${sub.code}, ID: ${sub.id})`);
    }
    subjectMap.set(item.name, sub.id);
  }

  console.log('\n=== STEP 2: Fetching Grade 1, 2, 3 Classes & Terms ===');

  const primaryClasses = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [1, 2, 3] },
      name: { not: 'التمهيدي' },
    },
    include: {
      class_academic_terms: {
        where: { deleted_at: null },
        include: {
          academic_term: true,
          class_subjects: {
            where: { deleted_at: null },
          },
        },
      },
    },
    orderBy: { grade_level: 'asc' },
  });

  const grade1Subjects = ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية'];
  const grade2Subjects = ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية'];
  const grade3Subjects = ['التربية الإسلامية', 'اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'التربية البدنية', 'التربية الفنية'];

  for (const cls of primaryClasses) {
    console.log(`\nProcessing Class: "${cls.name}" (ID: ${cls.id}, Grade Level: ${cls.grade_level})`);

    let targetSubjectNames = grade1Subjects;
    if (cls.grade_level === 2) targetSubjectNames = grade2Subjects;
    if (cls.grade_level === 3) targetSubjectNames = grade3Subjects;

    for (const term of cls.class_academic_terms) {
      console.log(`  -> Term: "${term.academic_term.name}" (ClassAcademicTerm ID: ${term.id})`);

      for (const subjName of targetSubjectNames) {
        const subId = subjectMap.get(subjName);
        if (!subId) continue;

        const existingCs = await prisma.classSubject.findFirst({
          where: {
            class_academic_term_id: term.id,
            subject_id: subId,
            deleted_at: null,
          },
        });

        if (existingCs) {
          // Update to 100% Coursework, 0% Exam
          await prisma.classSubject.update({
            where: { id: existingCs.id },
            data: {
              max_score: 100.0,
              max_coursework_score: 100.0,
              max_exam_score: 0.0,
              exam_passing_score: 0.0,
              passing_score: 50.0,
            },
          });
          console.log(`     [UPDATED] ${subjName}: Max=100, Coursework=100 (100%), Exam=0, Passing=50`);
        } else {
          // Create new assignment
          await prisma.classSubject.create({
            data: {
              class_id: cls.id,
              subject_id: subId,
              class_academic_term_id: term.id,
              max_score: 100.0,
              max_coursework_score: 100.0,
              max_exam_score: 0.0,
              exam_passing_score: 0.0,
              passing_score: 50.0,
            },
          });
          console.log(`     [CREATED] ${subjName}: Max=100, Coursework=100 (100%), Exam=0, Passing=50`);
        }
      }

      // Check if there are subjects that shouldn't be in early primary (like Computer / الحاسوب if added)
      const unwanted = await prisma.classSubject.findMany({
        where: {
          class_academic_term_id: term.id,
          deleted_at: null,
          subject: {
            name: { notIn: targetSubjectNames },
          },
        },
        include: { subject: true },
      });

      for (const uw of unwanted) {
        // Soft delete or adjust
        await prisma.classSubject.update({
          where: { id: uw.id },
          data: { deleted_at: new Date() },
        });
        console.log(`     [REMOVED UNWANTED] ${uw.subject.name} removed from early primary grade curriculum.`);
      }
    }
  }

  console.log('\n=== COMPLETED SUCCESSFULLY ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
