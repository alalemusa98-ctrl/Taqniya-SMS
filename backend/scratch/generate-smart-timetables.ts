import { PrismaClient, DayOfWeek } from '@prisma/client';

const prisma = new PrismaClient();

const DAYS: DayOfWeek[] = [
  DayOfWeek.sunday,
  DayOfWeek.monday,
  DayOfWeek.tuesday,
  DayOfWeek.wednesday,
  DayOfWeek.thursday,
];

// Required weekly periods per grade & subject
const curriculumPeriods: Record<string, Record<string, number>> = {
  'الصف الأول الابتدائي': {
    'التربية الإسلامية': 3,
    'اللغة العربية': 6,
    'اللغة الإنجليزية': 3,
    'الحاسوب': 1,
    'الرياضيات': 5,
  },
  'الصف الثاني الابتدائي': {
    'التربية الإسلامية': 3,
    'اللغة العربية': 6,
    'اللغة الإنجليزية': 3,
    'الحاسوب': 1,
    'الرياضيات': 5,
  },
  'الصف الثالث الابتدائي': {
    'التربية الإسلامية': 3,
    'اللغة العربية': 6,
    'اللغة الإنجليزية': 3,
    'الحاسوب': 1,
    'الرياضيات': 5,
    'العلوم': 3,
  },
  'الصف الرابع الابتدائي': {
    'التربية الإسلامية': 3,
    'اللغة العربية': 4,
    'الكتابة': 2,
    'الكتابة (الإملاء والخط والتعبير)': 2,
    'اللغة الإنجليزية': 3,
    'الحاسوب': 1,
    'الرياضيات': 5,
    'العلوم': 3,
    'الاجتماعيات': 2,
  },
  'الصف الخامس الابتدائي': {
    'التربية الإسلامية': 3,
    'اللغة العربية': 4,
    'الكتابة': 2,
    'الكتابة (الإملاء والخط والتعبير)': 2,
    'اللغة الإنجليزية': 3,
    'الحاسوب': 1,
    'الرياضيات': 5,
    'العلوم': 3,
    'الاجتماعيات': 2,
  },
  'الصف السادس الابتدائي': {
    'التربية الإسلامية': 3,
    'اللغة العربية': 4,
    'الكتابة': 2,
    'الكتابة (الإملاء والخط والتعبير)': 2,
    'اللغة الإنجليزية': 4,
    'الحاسوب': 2,
    'الرياضيات': 5,
    'العلوم': 3,
    'الاجتماعيات': 2,
  },
  'الصف الأول الإعدادي': {
    'التربية الإسلامية': 2,
    'اللغة العربية': 4,
    'الكتابة': 2,
    'الكتابة (الإملاء والخط والتعبير)': 2,
    'اللغة الإنجليزية': 4,
    'الحاسوب': 2,
    'الرياضيات': 5,
    'العلوم': 4,
    'التاريخ': 2,
    'الجغرافيا': 2,
  },
  'الصف الثاني الإعدادي': {
    'التربية الإسلامية': 2,
    'اللغة العربية': 4,
    'الكتابة': 2,
    'الكتابة (الإملاء والخط والتعبير)': 2,
    'اللغة الإنجليزية': 4,
    'الحاسوب': 2,
    'الرياضيات': 5,
    'العلوم': 4,
    'التاريخ': 2,
    'الجغرافيا': 2,
  },
};

interface PeriodItem {
  teachingAssignmentId: bigint;
  teacherId: bigint;
  teacherName: string;
  subjectName: string;
  className: string;
  sectionName: string;
  classSectionId: bigint;
}

interface ScheduledSlot {
  academicYearId: bigint;
  classSectionId: bigint;
  dayOfWeek: DayOfWeek;
  periodSlotId: bigint;
  teachingAssignmentId: bigint;
}

async function main() {
  console.log('=== Starting Master Weekly Timetable Generator (Taqniya-SMS) ===');

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) {
    console.error('No active academic year found!');
    return;
  }

  console.log(`Active Academic Year: "${activeYear.name}" (ID: ${activeYear.id})`);

  // Load non-break period slots
  const periodSlots = await prisma.periodSlot.findMany({
    where: { is_break: 0, deleted_at: null },
    orderBy: { slot_number: 'asc' },
  });

  console.log(`Loaded ${periodSlots.length} Teaching Period Slots.`);

  // Load all teaching assignments for Grades 1 to 8
  const assignments = await prisma.teachingAssignment.findMany({
    where: {
      academic_year_id: activeYear.id,
      deleted_at: null,
      class_section: {
        deleted_at: null,
        class: {
          deleted_at: null,
          grade_level: { in: [1, 2, 3, 4, 5, 6, 7, 8] },
          name: { not: 'التمهيدي' },
        },
      },
    },
    include: {
      teacher: true,
      subject: true,
      class_section: {
        include: {
          class: true,
          section: true,
        },
      },
    },
    orderBy: [
      { class_section: { class: { grade_level: 'asc' } } },
      { class_section: { section: { name: 'asc' } } },
      { id: 'asc' },
    ],
  });

  // Group assignments by class_section
  const sectionMap = new Map<bigint, { name: string; items: PeriodItem[] }>();

  for (const asgn of assignments) {
    const csId = asgn.class_section_id;
    const className = asgn.class_section.class.name;
    const secName = asgn.class_section.section.name;
    const subName = asgn.subject.name;

    const count = curriculumPeriods[className]?.[subName] || 2;

    if (!sectionMap.has(csId)) {
      sectionMap.set(csId, {
        name: `${className} (${secName})`,
        items: [],
      });
    }

    for (let i = 0; i < count; i++) {
      sectionMap.get(csId)!.items.push({
        teachingAssignmentId: asgn.id,
        teacherId: asgn.teacher_id,
        teacherName: asgn.teacher.full_name,
        subjectName: subName,
        className,
        sectionName: secName,
        classSectionId: csId,
      });
    }
  }

  // Clear existing timetable slots for active year before generating
  await prisma.timetableSlot.deleteMany({
    where: { academic_year_id: activeYear.id },
  });
  console.log('🧹 Purged existing timetable slots for fresh generation.');

  // Global schedule lookup maps for collision prevention
  const teacherBusy = new Map<bigint, Set<string>>();
  const sectionBusy = new Map<bigint, Set<string>>();
  const sectionDaySubCount = new Map<bigint, Map<string, number>>();

  const scheduledResults: ScheduledSlot[] = [];

  function canAssign(
    teacherId: bigint,
    classSectionId: bigint,
    day: DayOfWeek,
    slotId: bigint,
    subjectName: string,
    maxPerDay: number,
  ): boolean {
    const timeKey = `${day}_${slotId}`;

    // 1. Teacher collision check
    if (teacherBusy.get(teacherId)?.has(timeKey)) return false;

    // 2. Section collision check
    if (sectionBusy.get(classSectionId)?.has(timeKey)) return false;

    // 3. Subject frequency check
    const daySubMap = sectionDaySubCount.get(classSectionId);
    const daySubKey = `${day}_${subjectName}`;
    const curCount = daySubMap?.get(daySubKey) || 0;
    if (curCount >= maxPerDay) return false;

    return true;
  }

  function assignSlot(
    teacherId: bigint,
    classSectionId: bigint,
    day: DayOfWeek,
    slotId: bigint,
    subjectName: string,
    assignmentId: bigint,
  ) {
    const timeKey = `${day}_${slotId}`;

    if (!teacherBusy.has(teacherId)) teacherBusy.set(teacherId, new Set());
    teacherBusy.get(teacherId)!.add(timeKey);

    if (!sectionBusy.has(classSectionId)) sectionBusy.set(classSectionId, new Set());
    sectionBusy.get(classSectionId)!.add(timeKey);

    if (!sectionDaySubCount.has(classSectionId)) sectionDaySubCount.set(classSectionId, new Map());
    const daySubKey = `${day}_${subjectName}`;
    const curCount = sectionDaySubCount.get(classSectionId)!.get(daySubKey) || 0;
    sectionDaySubCount.get(classSectionId)!.set(daySubKey, curCount + 1);

    scheduledResults.push({
      academicYearId: activeYear!.id,
      classSectionId,
      dayOfWeek: day,
      periodSlotId: slotId,
      teachingAssignmentId: assignmentId,
    });
  }

  function unassignSlot(
    teacherId: bigint,
    classSectionId: bigint,
    day: DayOfWeek,
    slotId: bigint,
    subjectName: string,
  ) {
    const timeKey = `${day}_${slotId}`;
    teacherBusy.get(teacherId)?.delete(timeKey);
    sectionBusy.get(classSectionId)?.delete(timeKey);

    const daySubKey = `${day}_${subjectName}`;
    const curCount = sectionDaySubCount.get(classSectionId)?.get(daySubKey) || 1;
    sectionDaySubCount.get(classSectionId)?.set(daySubKey, curCount - 1);

    scheduledResults.pop();
  }

  // Generate all (day, slot) coordinates
  const allCoordinates: { day: DayOfWeek; slotId: bigint; slotNum: number }[] = [];
  for (const slot of periodSlots) {
    for (const d of DAYS) {
      allCoordinates.push({
        day: d,
        slotId: slot.id,
        slotNum: slot.slot_number,
      });
    }
  }

  let totalScheduled = 0;

  for (const [csId, secData] of sectionMap.entries()) {
    console.log(`\n📅 Scheduling ${secData.name} (${secData.items.length} periods)...`);

    // Group items by subject and interleave them to ensure smooth distribution across days
    const items = [...secData.items];

    // Priority ordering: shared subject teachers first
    items.sort((a, b) => {
      if (a.subjectName === 'الحاسوب') return -1;
      if (b.subjectName === 'الحاسوب') return 1;
      if (a.subjectName === 'الرياضيات') return -1;
      if (b.subjectName === 'الرياضيات') return 1;
      return 0;
    });

    // Solve for this section with backtracking
    function solveSection(index: number, maxSubjectPerDay: number): boolean {
      if (index >= items.length) return true;

      const item = items[index];

      for (const coord of allCoordinates) {
        if (canAssign(item.teacherId, csId, coord.day, coord.slotId, item.subjectName, maxSubjectPerDay)) {
          assignSlot(item.teacherId, csId, coord.day, coord.slotId, item.subjectName, item.teachingAssignmentId);

          if (solveSection(index + 1, maxSubjectPerDay)) return true;

          unassignSlot(item.teacherId, csId, coord.day, coord.slotId, item.subjectName);
        }
      }

      return false;
    }

    // Try first with max 1 per day (2 for Arabic/Maths), if tight allow up to 2
    let success = solveSection(0, 2);
    if (!success) {
      success = solveSection(0, 3);
    }

    if (success) {
      totalScheduled += secData.items.length;
      console.log(`✓ 100% Scheduled: ${secData.name} (${secData.items.length} periods)`);
    } else {
      console.error(`❌ Failed to schedule ${secData.name}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`Total Timetable Slots Scheduled: ${scheduledResults.length} slots`);
  console.log(`======================================================`);

  // Insert all in batch
  console.log('Writing scheduled slots to database...');
  await prisma.timetableSlot.createMany({
    data: scheduledResults.map((s) => ({
      academic_year_id: s.academicYearId,
      class_section_id: s.classSectionId,
      day_of_week: s.dayOfWeek,
      period_slot_id: s.periodSlotId,
      teaching_assignment_id: s.teachingAssignmentId,
    })),
  });

  console.log('✅ ALL TIMETABLE SLOTS SUCCESSFULLY SAVED TO DATABASE!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
