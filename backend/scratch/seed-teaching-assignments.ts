import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Applying Teaching Assignments (Grades 1 to 8) ===');

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) {
    console.error('No active academic year found!');
    return;
  }

  console.log(`Active Academic Year: "${activeYear.name}" (ID: ${activeYear.id})`);

  // Build subject map
  const subjects = await prisma.subject.findMany({
    where: { deleted_at: null },
  });
  const subjectMap = new Map<string, bigint>();
  for (const s of subjects) {
    subjectMap.set(s.name, s.id);
    if (s.code) subjectMap.set(s.code, s.id);
  }

  // Build teacher map by code and name
  const teachers = await prisma.teacher.findMany({
    where: { deleted_at: null },
    include: { user: true },
  });
  const teacherMap = new Map<string, bigint>();
  for (const t of teachers) {
    teacherMap.set(t.user.user_code, t.id);
    teacherMap.set(t.full_name, t.id);
  }

  // Get all class sections for Grades 1 to 8
  const classes = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [1, 2, 3, 4, 5, 6, 7, 8] },
      name: { not: 'التمهيدي' },
    },
    include: {
      class_sections: {
        where: { deleted_at: null },
        include: { section: true },
      },
    },
    orderBy: { grade_level: 'asc' },
  });

  // Assignment rules per grade and section
  // Maps: (grade, sectionName, subjectName) -> teacherCode
  const assignmentRules: { grade: number; section: string; subject: string; teacherCode: string }[] = [];

  // Grade 1 (Sections: شعبة أ, شعبة ب)
  for (const sec of ['شعبة أ', 'شعبة ب']) {
    assignmentRules.push(
      { grade: 1, section: sec, subject: 'التربية الإسلامية', teacherCode: 'TCH-101' },
      { grade: 1, section: sec, subject: 'اللغة العربية', teacherCode: 'TCH-101' },
      { grade: 1, section: sec, subject: 'الرياضيات', teacherCode: 'TCH-201' },
      { grade: 1, section: sec, subject: 'اللغة الإنجليزية', teacherCode: 'TCH-301' },
      { grade: 1, section: sec, subject: 'الحاسوب', teacherCode: 'TCH-601' },
    );
  }

  // Grade 2 (Sections: شعبة أ, شعبة ب)
  for (const sec of ['شعبة أ', 'شعبة ب']) {
    assignmentRules.push(
      { grade: 2, section: sec, subject: 'التربية الإسلامية', teacherCode: 'TCH-102' },
      { grade: 2, section: sec, subject: 'اللغة العربية', teacherCode: 'TCH-102' },
      { grade: 2, section: sec, subject: 'الرياضيات', teacherCode: 'TCH-201' },
      { grade: 2, section: sec, subject: 'اللغة الإنجليزية', teacherCode: 'TCH-301' },
      { grade: 2, section: sec, subject: 'الحاسوب', teacherCode: 'TCH-601' },
    );
  }

  // Grade 3 (Sections: شعبة أ, شعبة ب, شعبة ج)
  for (const sec of ['شعبة أ', 'شعبة ب']) {
    assignmentRules.push(
      { grade: 3, section: sec, subject: 'التربية الإسلامية', teacherCode: 'TCH-103' },
      { grade: 3, section: sec, subject: 'اللغة العربية', teacherCode: 'TCH-103' },
      { grade: 3, section: sec, subject: 'الرياضيات', teacherCode: 'TCH-202' },
      { grade: 3, section: sec, subject: 'العلوم', teacherCode: 'TCH-401' },
      { grade: 3, section: sec, subject: 'اللغة الإنجليزية', teacherCode: 'TCH-301' },
      { grade: 3, section: sec, subject: 'الحاسوب', teacherCode: 'TCH-601' },
    );
  }
  assignmentRules.push(
    { grade: 3, section: 'شعبة ج', subject: 'التربية الإسلامية', teacherCode: 'TCH-104' },
    { grade: 3, section: 'شعبة ج', subject: 'اللغة العربية', teacherCode: 'TCH-104' },
    { grade: 3, section: 'شعبة ج', subject: 'الرياضيات', teacherCode: 'TCH-202' },
    { grade: 3, section: 'شعبة ج', subject: 'العلوم', teacherCode: 'TCH-401' },
    { grade: 3, section: 'شعبة ج', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-301' },
    { grade: 3, section: 'شعبة ج', subject: 'الحاسوب', teacherCode: 'TCH-601' },
  );

  // Grade 4 (Sections: شعبة أ, شعبة ب)
  assignmentRules.push(
    // 4 - A
    { grade: 4, section: 'شعبة أ', subject: 'التربية الإسلامية', teacherCode: 'TCH-104' },
    { grade: 4, section: 'شعبة أ', subject: 'اللغة العربية', teacherCode: 'TCH-104' },
    { grade: 4, section: 'شعبة أ', subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-104' },
    { grade: 4, section: 'شعبة أ', subject: 'الرياضيات', teacherCode: 'TCH-203' },
    { grade: 4, section: 'شعبة أ', subject: 'العلوم', teacherCode: 'TCH-401' },
    { grade: 4, section: 'شعبة أ', subject: 'الاجتماعيات', teacherCode: 'TCH-501' },
    { grade: 4, section: 'شعبة أ', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-302' },
    { grade: 4, section: 'شعبة أ', subject: 'الحاسوب', teacherCode: 'TCH-601' },

    // 4 - B
    { grade: 4, section: 'شعبة ب', subject: 'التربية الإسلامية', teacherCode: 'TCH-105' },
    { grade: 4, section: 'شعبة ب', subject: 'اللغة العربية', teacherCode: 'TCH-105' },
    { grade: 4, section: 'شعبة ب', subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-105' },
    { grade: 4, section: 'شعبة ب', subject: 'الرياضيات', teacherCode: 'TCH-203' },
    { grade: 4, section: 'شعبة ب', subject: 'العلوم', teacherCode: 'TCH-401' },
    { grade: 4, section: 'شعبة ب', subject: 'الاجتماعيات', teacherCode: 'TCH-501' },
    { grade: 4, section: 'شعبة ب', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-302' },
    { grade: 4, section: 'شعبة ب', subject: 'الحاسوب', teacherCode: 'TCH-601' },
  );

  // Grade 5 (Sections: شعبة أ, شعبة ب)
  assignmentRules.push(
    // 5 - A
    { grade: 5, section: 'شعبة أ', subject: 'التربية الإسلامية', teacherCode: 'TCH-105' },
    { grade: 5, section: 'شعبة أ', subject: 'اللغة العربية', teacherCode: 'TCH-105' },
    { grade: 5, section: 'شعبة أ', subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-105' },
    { grade: 5, section: 'شعبة أ', subject: 'الرياضيات', teacherCode: 'TCH-203' },
    { grade: 5, section: 'شعبة أ', subject: 'العلوم', teacherCode: 'TCH-402' },
    { grade: 5, section: 'شعبة أ', subject: 'الاجتماعيات', teacherCode: 'TCH-501' },
    { grade: 5, section: 'شعبة أ', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-302' },
    { grade: 5, section: 'شعبة أ', subject: 'الحاسوب', teacherCode: 'TCH-601' },

    // 5 - B
    { grade: 5, section: 'شعبة ب', subject: 'التربية الإسلامية', teacherCode: 'TCH-106' },
    { grade: 5, section: 'شعبة ب', subject: 'اللغة العربية', teacherCode: 'TCH-106' },
    { grade: 5, section: 'شعبة ب', subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-106' },
    { grade: 5, section: 'شعبة ب', subject: 'الرياضيات', teacherCode: 'TCH-203' },
    { grade: 5, section: 'شعبة ب', subject: 'العلوم', teacherCode: 'TCH-402' },
    { grade: 5, section: 'شعبة ب', subject: 'الاجتماعيات', teacherCode: 'TCH-501' },
    { grade: 5, section: 'شعبة ب', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-302' },
    { grade: 5, section: 'شعبة ب', subject: 'الحاسوب', teacherCode: 'TCH-601' },
  );

  // Grade 6 (Sections: شعبة أ, شعبة ب, شعبة ج)
  assignmentRules.push(
    // 6 - A
    { grade: 6, section: 'شعبة أ', subject: 'التربية الإسلامية', teacherCode: 'TCH-106' },
    { grade: 6, section: 'شعبة أ', subject: 'اللغة العربية', teacherCode: 'TCH-106' },
    { grade: 6, section: 'شعبة أ', subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-106' },
    { grade: 6, section: 'شعبة أ', subject: 'الرياضيات', teacherCode: 'TCH-204' },
    { grade: 6, section: 'شعبة أ', subject: 'العلوم', teacherCode: 'TCH-402' },
    { grade: 6, section: 'شعبة أ', subject: 'الاجتماعيات', teacherCode: 'TCH-501' },
    { grade: 6, section: 'شعبة أ', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-302' },
    { grade: 6, section: 'شعبة أ', subject: 'الحاسوب', teacherCode: 'TCH-601' },

    // 6 - B
    { grade: 6, section: 'شعبة ب', subject: 'التربية الإسلامية', teacherCode: 'TCH-107' },
    { grade: 6, section: 'شعبة ب', subject: 'اللغة العربية', teacherCode: 'TCH-107' },
    { grade: 6, section: 'شعبة ب', subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-107' },
    { grade: 6, section: 'شعبة ب', subject: 'الرياضيات', teacherCode: 'TCH-204' },
    { grade: 6, section: 'شعبة ب', subject: 'العلوم', teacherCode: 'TCH-402' },
    { grade: 6, section: 'شعبة ب', subject: 'الاجتماعيات', teacherCode: 'TCH-501' },
    { grade: 6, section: 'شعبة ب', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-302' },
    { grade: 6, section: 'شعبة ب', subject: 'الحاسوب', teacherCode: 'TCH-601' },

    // 6 - C
    { grade: 6, section: 'شعبة ج', subject: 'التربية الإسلامية', teacherCode: 'TCH-107' },
    { grade: 6, section: 'شعبة ج', subject: 'اللغة العربية', teacherCode: 'TCH-107' },
    { grade: 6, section: 'شعبة ج', subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-107' },
    { grade: 6, section: 'شعبة ج', subject: 'الرياضيات', teacherCode: 'TCH-204' },
    { grade: 6, section: 'شعبة ج', subject: 'العلوم', teacherCode: 'TCH-402' },
    { grade: 6, section: 'شعبة ج', subject: 'الاجتماعيات', teacherCode: 'TCH-501' },
    { grade: 6, section: 'شعبة ج', subject: 'اللغة الإنجليزية', teacherCode: 'TCH-302' },
    { grade: 6, section: 'شعبة ج', subject: 'الحاسوب', teacherCode: 'TCH-601' },
  );

  // Grade 7 (Sections: شعبة أ, شعبة ب)
  for (const sec of ['شعبة أ', 'شعبة ب']) {
    assignmentRules.push(
      { grade: 7, section: sec, subject: 'التربية الإسلامية', teacherCode: 'TCH-108' },
      { grade: 7, section: sec, subject: 'اللغة العربية', teacherCode: 'TCH-108' },
      { grade: 7, section: sec, subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-108' },
      { grade: 7, section: sec, subject: 'الرياضيات', teacherCode: 'TCH-205' },
      { grade: 7, section: sec, subject: 'العلوم', teacherCode: 'TCH-403' },
      { grade: 7, section: sec, subject: 'التاريخ', teacherCode: 'TCH-502' },
      { grade: 7, section: sec, subject: 'الجغرافيا', teacherCode: 'TCH-502' },
      { grade: 7, section: sec, subject: 'اللغة الإنجليزية', teacherCode: 'TCH-303' },
      { grade: 7, section: sec, subject: 'الحاسوب', teacherCode: 'TCH-601' },
    );
  }

  // Grade 8 (Sections: شعبة أ, شعبة ب)
  for (const sec of ['شعبة أ', 'شعبة ب']) {
    assignmentRules.push(
      { grade: 8, section: sec, subject: 'التربية الإسلامية', teacherCode: 'TCH-108' },
      { grade: 8, section: sec, subject: 'اللغة العربية', teacherCode: 'TCH-108' },
      { grade: 8, section: sec, subject: 'الكتابة (الإملاء والخط والتعبير)', teacherCode: 'TCH-108' },
      { grade: 8, section: sec, subject: 'الرياضيات', teacherCode: 'TCH-205' },
      { grade: 8, section: sec, subject: 'العلوم', teacherCode: 'TCH-403' },
      { grade: 8, section: sec, subject: 'التاريخ', teacherCode: 'TCH-502' },
      { grade: 8, section: sec, subject: 'الجغرافيا', teacherCode: 'TCH-502' },
      { grade: 8, section: sec, subject: 'اللغة الإنجليزية', teacherCode: 'TCH-303' },
      { grade: 8, section: sec, subject: 'الحاسوب', teacherCode: 'TCH-601' },
    );
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const rule of assignmentRules) {
    const targetClass = classes.find((c) => c.grade_level === rule.grade);
    if (!targetClass) continue;

    const classSection = targetClass.class_sections.find((cs) => cs.section.name === rule.section);
    if (!classSection) {
      console.warn(`ClassSection not found for Grade ${rule.grade} ${rule.section}`);
      continue;
    }

    const subId = subjectMap.get(rule.subject);
    if (!subId) {
      console.warn(`Subject not found: "${rule.subject}"`);
      continue;
    }

    const teacherId = teacherMap.get(rule.teacherCode);
    if (!teacherId) {
      console.warn(`Teacher not found for code: "${rule.teacherCode}"`);
      continue;
    }

    const existingAssignment = await prisma.teachingAssignment.findFirst({
      where: {
        academic_year_id: activeYear.id,
        class_section_id: classSection.id,
        subject_id: subId,
      },
    });

    if (existingAssignment) {
      await prisma.teachingAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          teacher_id: teacherId,
          deleted_at: null,
        },
      });
      updatedCount++;
    } else {
      await prisma.teachingAssignment.create({
        data: {
          academic_year_id: activeYear.id,
          class_section_id: classSection.id,
          subject_id: subId,
          teacher_id: teacherId,
        },
      });
      createdCount++;
    }
  }

  console.log(`\n=== Teaching Assignments Created: ${createdCount}, Updated: ${updatedCount} ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
