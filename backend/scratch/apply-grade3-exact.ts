import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Step 1: Ensure Grade 3 has all 3 Terms (الفترات الثلاث) ===');

  const grade3 = await prisma.class.findFirst({
    where: { grade_level: 3 },
  });

  if (!grade3) {
    console.error('Grade 3 class not found!');
    return;
  }

  console.log(`Found Class: "${grade3.name}" (ID: ${grade3.id})`);

  const allTerms = await prisma.academicTerm.findMany({
    where: { deleted_at: null },
    orderBy: { term_number: 'asc' },
  });

  // Ensure all 3 terms exist in class_academic_terms for Grade 3
  for (const t of allTerms) {
    let ct = await prisma.classAcademicTerm.findFirst({
      where: {
        class_id: grade3.id,
        academic_term_id: t.id,
      },
    });

    if (!ct) {
      ct = await prisma.classAcademicTerm.create({
        data: {
          class_id: grade3.id,
          academic_term_id: t.id,
          is_active: 1,
          is_closed: 0,
        },
      });
      console.log(`+ Created ClassTerm: Class "${grade3.name}" -> Term "${t.name}" (ID: ${ct.id})`);
    } else if (ct.deleted_at) {
      await prisma.classAcademicTerm.update({
        where: { id: ct.id },
        data: { deleted_at: null, is_active: 1 },
      });
      console.log(`✓ Restored ClassTerm: Class "${grade3.name}" -> Term "${t.name}" (ID: ${ct.id})`);
    } else {
      console.log(`✓ Existing ClassTerm: Class "${grade3.name}" -> Term "${t.name}" (ID: ${ct.id})`);
    }
  }

  console.log('\n=== Step 2: Subject Definitions for Grade 3 (6 Subjects) ===');

  const subjectsDef = [
    { name: 'التربية الإسلامية', code: 'ISLAM', t1: 36, t2: 36, t3: 48, total: 120, pass: 60 },
    { name: 'اللغة العربية', code: 'ARAB', t1: 72, t2: 72, t3: 96, total: 240, pass: 120 },
    { name: 'اللغة الإنجليزية', code: 'ENG', t1: 36, t2: 36, t3: 48, total: 120, pass: 60 },
    { name: 'الحاسوب', code: 'IT', t1: 12, t2: 12, t3: 16, total: 40, pass: 20 },
    { name: 'الرياضيات', code: 'MATH', t1: 60, t2: 60, t3: 80, total: 200, pass: 100 },
    { name: 'العلوم', code: 'SCI', t1: 36, t2: 36, t3: 48, total: 120, pass: 60 },
  ];

  const subjectMap = new Map<string, bigint>();
  for (const s of subjectsDef) {
    let sub = await prisma.subject.findFirst({
      where: {
        OR: [{ name: s.name }, { code: s.code }],
        deleted_at: null,
      },
    });
    if (!sub) {
      sub = await prisma.subject.create({
        data: { name: s.name, code: s.code },
      });
    }
    subjectMap.set(s.name, sub.id);
  }

  const grade3ClassTerms = await prisma.classAcademicTerm.findMany({
    where: {
      class_id: grade3.id,
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

  for (const ct of grade3ClassTerms) {
    const termNum = ct.academic_term.term_number;
    console.log(`\nConfiguring ${ct.academic_term.name} (Term #${termNum}, ID: ${ct.id}):`);

    for (const s of subjectsDef) {
      const subId = subjectMap.get(s.name)!;
      let termScore = s.t1;
      if (termNum === 2) termScore = s.t2;
      if (termNum === 3) termScore = s.t3;

      const passing = termScore * 0.5;

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
            max_score: termScore,
            max_coursework_score: termScore, // 100% أعمال سنة
            max_exam_score: 0.0,              // 0 امتحان
            exam_passing_score: 0.0,
            passing_score: passing,
            deleted_at: null,
          },
        });
        console.log(`  ✓ [100% أعمال سنة] ${s.name}: Max=${termScore} (أعمال=${termScore}, امتحان=0, صغرى=${passing})`);
      } else {
        await prisma.classSubject.create({
          data: {
            class_id: grade3.id,
            subject_id: subId,
            class_academic_term_id: ct.id,
            max_score: termScore,
            max_coursework_score: termScore, // 100% أعمال سنة
            max_exam_score: 0.0,              // 0 امتحان
            exam_passing_score: 0.0,
            passing_score: passing,
          },
        });
        console.log(`  + [CREATED] ${s.name}: Max=${termScore} (أعمال=${termScore}, امتحان=0, صغرى=${passing})`);
      }
    }

    // Clean up unwanted subjects not in Grade 3 list
    const unwanted = await prisma.classSubject.findMany({
      where: {
        class_academic_term_id: ct.id,
        deleted_at: null,
        subject: {
          name: { notIn: allowedSubjectNames },
        },
      },
    });

    for (const uw of unwanted) {
      await prisma.classSubject.update({
        where: { id: uw.id },
        data: { deleted_at: new Date() },
      });
      console.log(`  - [REMOVED UNWANTED] Subject ID ${uw.subject_id} from Term ${ct.id}`);
    }
  }

  console.log('\n=== COMPLETED GRADE 3 SYNCHRONIZATION SUCCESSFULLY ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
