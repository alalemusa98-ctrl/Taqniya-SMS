import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  const teachers = await prisma.teacher.findMany({
    where: { deleted_at: null },
    include: {
      user: true,
      teaching_assignments: {
        where: {
          academic_year_id: activeYear?.id,
          deleted_at: null,
        },
        include: {
          class_section: {
            include: {
              class: true,
              section: true,
            },
          },
          subject: true,
        },
      },
    },
    orderBy: { user: { user_code: 'asc' } },
  });

  console.log('=== Teaching Assignments & Workload Verification ===');

  // We can calculate weekly periods based on the grade subject periods
  const periodsTable: Record<string, Record<string, number>> = {
    'الصف الأول الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5 },
    'الصف الثاني الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5 },
    'الصف الثالث الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3 },
    'الصف الرابع الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
    'الصف الخامس الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
    'الصف السادس الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
    'الصف الأول الإعدادي': { 'التربية الإسلامية': 2, 'اللغة العربية': 4, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 4, 'التاريخ': 2, 'الجغرافيا': 2 },
    'الصف الثاني الإعدادي': { 'التربية الإسلامية': 2, 'اللغة العربية': 4, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 4, 'التاريخ': 2, 'الجغرافيا': 2 },
  };

  let totalSchoolPeriods = 0;

  for (const t of teachers) {
    let teacherWeeklyPeriods = 0;
    console.log(`\n👨‍🏫 ${t.full_name} (${t.user.user_code}) - التخصص: ${t.specialization}`);
    console.log(`عدد الإسنادات: ${t.teaching_assignments.length}`);

    for (const a of t.teaching_assignments) {
      const className = a.class_section.class.name;
      const secName = a.class_section.section.name;
      const subName = a.subject.name;
      const p = periodsTable[className]?.[subName] || 0;
      teacherWeeklyPeriods += p;
      console.log(`   - ${className} (${secName}) | مادة: ${subName} -> ${p} حصص`);
    }
    console.log(`>> إجمالي نصاب المعلم الأسبوعي: ${teacherWeeklyPeriods} حصة (بمعدل ${(teacherWeeklyPeriods / 5).toFixed(1)} حصة/يوم)`);
    totalSchoolPeriods += teacherWeeklyPeriods;
  }

  console.log(`\n======================================================`);
  console.log(`إجمالي الحصص المسندة بالمدرسة بالكامل: ${totalSchoolPeriods} حصة أسبوعياً`);
  console.log(`======================================================`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
