import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Syncing Official Libyan Curriculum (Grades 1 to 5) ===');

  const allSubjectsMeta = [
    { name: 'التربية الإسلامية', code: 'ISLAM' },
    { name: 'اللغة العربية', code: 'ARAB' },
    { name: 'الكتابة (الإملاء والخط والتعبير)', code: 'WRITING' },
    { name: 'اللغة الإنجليزية', code: 'ENG' },
    { name: 'الحاسوب', code: 'IT' },
    { name: 'الرياضيات', code: 'MATH' },
    { name: 'العلوم', code: 'SCI' },
    { name: 'الاجتماعيات', code: 'SOCIAL' },
  ];

  const subjectMap = new Map<string, bigint>();

  for (const s of allSubjectsMeta) {
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
      console.log(`+ Created Subject: "${s.name}" (Code: ${s.code}, ID: ${sub.id})`);
    } else {
      subjectMap.set(s.name, sub.id);
    }
  }

  const allTerms = await prisma.academicTerm.findMany({
    where: { deleted_at: null },
    orderBy: { term_number: 'asc' },
  });

  // Curriculum definitions per grade
  // Grades 1 & 2 (Total: 720, Passing: 360 / 50%, 100% continuous assessment across 3 periods)
  const g12Defs = [
    { name: 'التربية الإسلامية', t1: 36, t2: 36, t3: 48, isExamT3: false },
    { name: 'اللغة العربية', t1: 72, t2: 72, t3: 96, isExamT3: false },
    { name: 'اللغة الإنجليزية', t1: 36, t2: 36, t3: 48, isExamT3: false },
    { name: 'الحاسوب', t1: 12, t2: 12, t3: 16, isExamT3: false },
    { name: 'الرياضيات', t1: 60, t2: 60, t3: 80, isExamT3: false },
  ];

  // Grade 3 (Total: 840, Passing: 420 / 50%, 100% continuous assessment across 3 periods)
  const g3Defs = [
    { name: 'التربية الإسلامية', t1: 36, t2: 36, t3: 48, isExamT3: false },
    { name: 'اللغة العربية', t1: 72, t2: 72, t3: 96, isExamT3: false },
    { name: 'اللغة الإنجليزية', t1: 36, t2: 36, t3: 48, isExamT3: false },
    { name: 'الحاسوب', t1: 12, t2: 12, t3: 16, isExamT3: false },
    { name: 'الرياضيات', t1: 60, t2: 60, t3: 80, isExamT3: false },
    { name: 'العلوم', t1: 36, t2: 36, t3: 48, isExamT3: false },
  ];

  // Grades 4 & 5 (Total: 920, Passing: 368 / 40%, Period 1 & 2 Coursework 30% each, Period 3 Final Exam 40%)
  const g45Defs = [
    { name: 'التربية الإسلامية', t1: 36, t2: 36, t3: 48, isExamT3: true },
    { name: 'اللغة العربية', t1: 48, t2: 48, t3: 64, isExamT3: true },
    { name: 'الكتابة (الإملاء والخط والتعبير)', t1: 24, t2: 24, t3: 32, isExamT3: true },
    { name: 'اللغة الإنجليزية', t1: 36, t2: 36, t3: 48, isExamT3: true },
    { name: 'الحاسوب', t1: 12, t2: 12, t3: 16, isExamT3: true },
    { name: 'الرياضيات', t1: 60, t2: 60, t3: 80, isExamT3: true },
    { name: 'العلوم', t1: 36, t2: 36, t3: 48, isExamT3: true },
    { name: 'الاجتماعيات', t1: 24, t2: 24, t3: 32, isExamT3: true },
  ];

  const primaryClasses = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [1, 2, 3, 4, 5] },
      name: { not: 'التمهيدي' },
    },
    orderBy: { grade_level: 'asc' },
  });

  for (const cls of primaryClasses) {
    console.log(`\n======================================================`);
    console.log(`Configuring: ${cls.name} (Grade: ${cls.grade_level}, ID: ${cls.id})`);
    console.log(`======================================================`);

    // Ensure class has all 3 academic terms
    for (const t of allTerms) {
      let ct = await prisma.classAcademicTerm.findFirst({
        where: {
          class_id: cls.id,
          academic_term_id: t.id,
        },
      });

      if (!ct) {
        ct = await prisma.classAcademicTerm.create({
          data: {
            class_id: cls.id,
            academic_term_id: t.id,
            is_active: t.term_number === 1 ? 1 : 0,
            is_closed: 0,
          },
        });
        console.log(`+ Created ClassTerm: ${cls.name} -> ${t.name} (ID: ${ct.id})`);
      } else if (ct.deleted_at) {
        await prisma.classAcademicTerm.update({
          where: { id: ct.id },
          data: { deleted_at: null, is_active: t.term_number === 1 ? 1 : 0 },
        });
      }
    }

    const classTerms = await prisma.classAcademicTerm.findMany({
      where: { class_id: cls.id, deleted_at: null },
      include: { academic_term: true },
      orderBy: { academic_term: { term_number: 'asc' } },
    });

    let currentDefs = g12Defs;
    let passingRatio = 0.5; // Grades 1-3 pass at 50%
    if (cls.grade_level === 3) {
      currentDefs = g3Defs;
      passingRatio = 0.5;
    } else if (cls.grade_level === 4 || cls.grade_level === 5) {
      currentDefs = g45Defs;
      passingRatio = 0.4; // Grades 4-5 pass at 40%
    }

    const allowedNames = currentDefs.map((d) => d.name);

    for (const ct of classTerms) {
      const termNum = ct.academic_term.term_number;
      console.log(`  -> Term: "${ct.academic_term.name}" (#${termNum}, ID: ${ct.id})`);

      for (const def of currentDefs) {
        const subId = subjectMap.get(def.name);
        if (!subId) continue;

        let maxScore = def.t1;
        let cw = def.t1;
        let exam = 0;

        if (termNum === 2) {
          maxScore = def.t2;
          cw = def.t2;
          exam = 0;
        } else if (termNum === 3) {
          maxScore = def.t3;
          if (def.isExamT3) {
            cw = 0;
            exam = def.t3;
          } else {
            cw = def.t3;
            exam = 0;
          }
        }

        const pass = maxScore * passingRatio;
        const examPass = exam * passingRatio;

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
              max_score: maxScore,
              max_coursework_score: cw,
              max_exam_score: exam,
              exam_passing_score: examPass,
              passing_score: pass,
              deleted_at: null,
            },
          });
          console.log(`     ✓ ${def.name}: درجة=${maxScore} (أعمال=${cw}, امتحان=${exam}, صغرى=${pass})`);
        } else {
          await prisma.classSubject.create({
            data: {
              class_id: cls.id,
              subject_id: subId,
              class_academic_term_id: ct.id,
              max_score: maxScore,
              max_coursework_score: cw,
              max_exam_score: exam,
              exam_passing_score: examPass,
              passing_score: pass,
            },
          });
          console.log(`     + [CREATED] ${def.name}: درجة=${maxScore} (أعمال=${cw}, امتحان=${exam}, صغرى=${pass})`);
        }
      }

      // Cleanup extra subjects
      const extras = await prisma.classSubject.findMany({
        where: {
          class_academic_term_id: ct.id,
          deleted_at: null,
          subject: {
            name: { notIn: allowedNames },
          },
        },
      });

      for (const ex of extras) {
        await prisma.classSubject.update({
          where: { id: ex.id },
          data: { deleted_at: new Date() },
        });
        console.log(`     - [REMOVED] Subject ID ${ex.subject_id} from Term ${ct.id}`);
      }
    }
  }

  console.log('\n=== ALL PRIMARY GRADES (1 to 5) SUCCESSFULLY SYNCHRONIZED ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
