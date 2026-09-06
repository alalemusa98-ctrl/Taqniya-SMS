import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Starting cleanup of test artifacts...');

  // 1. Delete timetable slots / assignments linked to test records if any
  const testYears = await prisma.academicYear.findMany({
    where: {
      OR: [
        { name: { contains: 'TestYear' } },
        { name: { contains: 'SecondYear' } },
        { name: { contains: 'Year-' } },
        { name: { contains: 'ToDelete' } },
        { name: { contains: 'العام 2026/2027-' } },
      ],
    },
    select: { id: true },
  });
  const testYearIds = testYears.map((y) => y.id);

  if (testYearIds.length > 0) {
    await prisma.timetableSlot.deleteMany({
      where: { academic_year_id: { in: testYearIds } },
    });
    await prisma.teachingAssignment.deleteMany({
      where: { academic_year_id: { in: testYearIds } },
    });
    await prisma.academicYear.deleteMany({
      where: { id: { in: testYearIds } },
    });
    console.log(`✅ Cleaned up ${testYearIds.length} test academic years.`);
  }

  // 2. Clean Class Academic Terms & Class Subjects linked to test terms or classes
  const testTerms = await prisma.academicTerm.findMany({
    where: {
      OR: [
        { name: { contains: 'Term-' } },
        { name: { contains: 'UpdatedTerm' } },
        { name: { contains: 'DelTerm' } },
        { name: { contains: 'TestTerm' } },
      ],
    },
    select: { id: true },
  });
  const testTermIds = testTerms.map((t) => t.id);

  if (testTermIds.length > 0) {
    await prisma.classAcademicTerm.deleteMany({
      where: { academic_term_id: { in: testTermIds } },
    });
    await prisma.academicTerm.deleteMany({
      where: { id: { in: testTermIds } },
    });
    console.log(`✅ Cleaned up ${testTermIds.length} test academic terms.`);
  }

  // 3. Clean test classes and class sections
  const testClasses = await prisma.class.findMany({
    where: {
      OR: [
        { name: { contains: 'Class-' } },
        { name: { contains: 'UpdatedClass' } },
        { name: { contains: 'ClassToDel' } },
        { name: { contains: 'الصف التجريبي-' } },
      ],
    },
    select: { id: true },
  });
  const testClassIds = testClasses.map((c) => c.id);

  if (testClassIds.length > 0) {
    const testClassSections = await prisma.classSection.findMany({
      where: { class_id: { in: testClassIds } },
      select: { id: true },
    });
    const testClassSectionIds = testClassSections.map((cs) => cs.id);

    if (testClassSectionIds.length > 0) {
      await prisma.teachingAssignment.deleteMany({
        where: { class_section_id: { in: testClassSectionIds } },
      });
      await prisma.classSection.deleteMany({
        where: { id: { in: testClassSectionIds } },
      });
    }

    await prisma.classSubject.deleteMany({
      where: { class_id: { in: testClassIds } },
    });
    await prisma.classAcademicTerm.deleteMany({
      where: { class_id: { in: testClassIds } },
    });
    await prisma.class.deleteMany({
      where: { id: { in: testClassIds } },
    });
    console.log(`✅ Cleaned up ${testClassIds.length} test classes.`);
  }

  // 4. Clean test stages
  const testStages = await prisma.academicStage.findMany({
    where: {
      OR: [
        { name: { contains: 'Stage-' } },
        { name: { contains: 'UpdatedStage' } },
        { name: { contains: 'DelStage' } },
        { name: { contains: 'مرحلة تجريبية-' } },
      ],
    },
    select: { id: true },
  });
  const testStageIds = testStages.map((s) => s.id);

  if (testStageIds.length > 0) {
    await prisma.academicStage.deleteMany({
      where: { id: { in: testStageIds } },
    });
    console.log(`✅ Cleaned up ${testStageIds.length} test stages.`);
  }

  // 5. Clean test sections & subjects
  const testSections = await prisma.section.findMany({
    where: {
      OR: [
        { name: { contains: 'Section-' } },
        { name: { contains: 'UpdatedSection' } },
        { name: { contains: 'DelSection' } },
        { name: { contains: 'شعبة تجريبية-' } },
      ],
    },
    select: { id: true },
  });
  if (testSections.length > 0) {
    await prisma.section.deleteMany({
      where: { id: { in: testSections.map((s) => s.id) } },
    });
    console.log(`✅ Cleaned up ${testSections.length} test sections.`);
  }

  const testSubjects = await prisma.subject.findMany({
    where: {
      OR: [
        { name: { contains: 'Subject-' } },
        { name: { contains: 'UpdatedSubject' } },
        { name: { contains: 'DelSubject' } },
        { name: { contains: 'الرياضيات المتقدمة-' } },
        { name: { contains: 'الفيزياء التجريبية-' } },
      ],
    },
    select: { id: true },
  });
  if (testSubjects.length > 0) {
    await prisma.subject.deleteMany({
      where: { id: { in: testSubjects.map((s) => s.id) } },
    });
    console.log(`✅ Cleaned up ${testSubjects.length} test subjects.`);
  }

  // 6. Clean test users & teachers
  const testTeachers = await prisma.teacher.findMany({
    where: {
      OR: [
        { full_name: { contains: 'معلم تجريبي' } },
        { full_name: { contains: 'أحمد محمود سالم-' } },
        { full_name: { contains: 'محمد علي حسن-' } },
      ],
    },
    select: { id: true, user_id: true },
  });
  if (testTeachers.length > 0) {
    await prisma.teachingAssignment.deleteMany({
      where: { teacher_id: { in: testTeachers.map((t) => t.id) } },
    });
    await prisma.teacher.deleteMany({
      where: { id: { in: testTeachers.map((t) => t.id) } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: testTeachers.map((t) => t.user_id) } },
    });
    console.log(`✅ Cleaned up ${testTeachers.length} test teachers.`);
  }

  console.log('✨ Cleanup completed successfully! Only official school data remains.');
}

cleanTestData()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
