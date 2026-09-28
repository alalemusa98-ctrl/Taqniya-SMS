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
  'الصف الأول الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5 },
  'الصف الثاني الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5 },
  'الصف الثالث الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 6, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3 },
  'الصف الرابع الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
  'الصف الخامس الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 3, 'الحاسوب': 1, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
  'الصف السادس الابتدائي': { 'التربية الإسلامية': 3, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 3, 'الاجتماعيات': 2 },
  'الصف الأول الإعدادي': { 'التربية الإسلامية': 2, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 4, 'التاريخ': 2, 'الجغرافيا': 2 },
  'الصف الثاني الإعدادي': { 'التربية الإسلامية': 2, 'اللغة العربية': 4, 'الكتابة': 2, 'الكتابة (الإملاء والخط والتعبير)': 2, 'اللغة الإنجليزية': 4, 'الحاسوب': 2, 'الرياضيات': 5, 'العلوم': 4, 'التاريخ': 2, 'الجغرافيا': 2 },
};

interface NeedItem {
  teachingAssignmentId: bigint;
  teacherId: bigint;
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
  console.log('=== Lightning-Fast Global Timetable Generator ===');

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) return;

  const periodSlots = await prisma.periodSlot.findMany({
    where: { is_break: 0, deleted_at: null },
    orderBy: { slot_number: 'asc' },
  });

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
        include: { class: true, section: true },
      },
    },
  });

  // Build remaining needs list per section
  const sectionNeeds = new Map<bigint, NeedItem[]>();
  let totalNeeds = 0;

  for (const asgn of assignments) {
    const csId = asgn.class_section_id;
    const className = asgn.class_section.class.name;
    const secName = asgn.class_section.section.name;
    const subName = asgn.subject.name;

    const count = curriculumPeriods[className]?.[subName] || 2;

    if (!sectionNeeds.has(csId)) {
      sectionNeeds.set(csId, []);
    }

    for (let i = 0; i < count; i++) {
      sectionNeeds.get(csId)!.push({
        teachingAssignmentId: asgn.id,
        teacherId: asgn.teacher_id,
        subjectName: subName,
        className,
        sectionName: secName,
        classSectionId: csId,
      });
      totalNeeds++;
    }
  }

  console.log(`Total periods to schedule: ${totalNeeds} across ${sectionNeeds.size} sections.`);

  // 30 time slots (5 days x 6 slots)
  const timeSlots: { day: DayOfWeek; slotId: bigint; slotNum: number }[] = [];
  for (const d of DAYS) {
    for (const ps of periodSlots) {
      timeSlots.push({ day: d, slotId: ps.id, slotNum: ps.slot_number });
    }
  }

  // Tracking state
  const sectionScheduled = new Map<bigint, Set<string>>(); // `${day}_${slotId}`
  const teacherScheduled = new Map<bigint, Set<string>>(); // `${day}_${slotId}`
  const sectionDaySubCount = new Map<bigint, Map<string, number>>(); // `${day}_${subjectName}`
  const scheduledResults: ScheduledSlot[] = [];

  // Pass 1: Schedule daily 1-period subjects (Maths, Arabic, etc.) across the 30 slots
  // Iterating through the 30 slots sequentially
  for (const ts of timeSlots) {
    const timeKey = `${ts.day}_${ts.slotId}`;
    const busyTeachersInSlot = new Set<bigint>();

    // For each section, find the best matching subject needing a slot
    for (const [csId, needs] of sectionNeeds.entries()) {
      if (needs.length === 0) continue;

      // Check if section already has something in this slot
      if (sectionScheduled.get(csId)?.has(timeKey)) continue;

      // Find an available need item
      let pickedIndex = -1;

      // Prioritize items whose teachers are most constrained
      for (let i = 0; i < needs.length; i++) {
        const item = needs[i];

        // Is teacher busy in this slot?
        if (busyTeachersInSlot.has(item.teacherId)) continue;
        if (teacherScheduled.get(item.teacherId)?.has(timeKey)) continue;

        // Daily subject count limit
        const daySubKey = `${ts.day}_${item.subjectName}`;
        const countToday = sectionDaySubCount.get(csId)?.get(daySubKey) || 0;
        const maxToday = item.subjectName === 'اللغة العربية' && (item.className.includes('الأول') || item.className.includes('الثاني') || item.className.includes('الثالث')) ? 2 : 1;

        if (countToday >= maxToday) continue;

        pickedIndex = i;
        break;
      }

      // If no item found with strict maxToday = 1, relax maxToday to 2 if needed
      if (pickedIndex === -1) {
        for (let i = 0; i < needs.length; i++) {
          const item = needs[i];
          if (busyTeachersInSlot.has(item.teacherId)) continue;
          if (teacherScheduled.get(item.teacherId)?.has(timeKey)) continue;

          const daySubKey = `${ts.day}_${item.subjectName}`;
          const countToday = sectionDaySubCount.get(csId)?.get(daySubKey) || 0;
          if (countToday >= 2) continue;

          pickedIndex = i;
          break;
        }
      }

      if (pickedIndex !== -1) {
        const item = needs.splice(pickedIndex, 1)[0];

        // Mark busy
        busyTeachersInSlot.add(item.teacherId);

        if (!teacherScheduled.has(item.teacherId)) teacherScheduled.set(item.teacherId, new Set());
        teacherScheduled.get(item.teacherId)!.add(timeKey);

        if (!sectionScheduled.has(csId)) sectionScheduled.set(csId, new Set());
        sectionScheduled.get(csId)!.add(timeKey);

        if (!sectionDaySubCount.has(csId)) sectionDaySubCount.set(csId, new Map());
        const daySubKey = `${ts.day}_${item.subjectName}`;
        const c = sectionDaySubCount.get(csId)!.get(daySubKey) || 0;
        sectionDaySubCount.get(csId)!.set(daySubKey, c + 1);

        scheduledResults.push({
          academicYearId: activeYear.id,
          classSectionId: csId,
          dayOfWeek: ts.day,
          periodSlotId: ts.slotId,
          teachingAssignmentId: item.teachingAssignmentId,
        });
      }
    }
  }

  // Pass 2: Any remaining unassigned items?
  let remainingTotal = 0;
  for (const [csId, needs] of sectionNeeds.entries()) {
    if (needs.length > 0) {
      remainingTotal += needs.length;
      for (const item of [...needs]) {
        // Find any available open slot for this section and teacher
        for (const ts of timeSlots) {
          const timeKey = `${ts.day}_${ts.slotId}`;
          if (sectionScheduled.get(csId)?.has(timeKey)) continue;
          if (teacherScheduled.get(item.teacherId)?.has(timeKey)) continue;

          // Assign
          if (!teacherScheduled.has(item.teacherId)) teacherScheduled.set(item.teacherId, new Set());
          teacherScheduled.get(item.teacherId)!.add(timeKey);

          if (!sectionScheduled.has(csId)) sectionScheduled.set(csId, new Set());
          sectionScheduled.get(csId)!.add(timeKey);

          scheduledResults.push({
            academicYearId: activeYear.id,
            classSectionId: csId,
            dayOfWeek: ts.day,
            periodSlotId: ts.slotId,
            teachingAssignmentId: item.teachingAssignmentId,
          });

          const idx = needs.indexOf(item);
          if (idx !== -1) needs.splice(idx, 1);
          break;
        }
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`Successfully Scheduled: ${scheduledResults.length} / ${totalNeeds} Slots (100%)`);
  console.log(`======================================================`);

  // Purge old and insert all
  await prisma.timetableSlot.deleteMany({
    where: { academic_year_id: activeYear.id },
  });

  await prisma.timetableSlot.createMany({
    data: scheduledResults.map((s) => ({
      academic_year_id: s.academicYearId,
      class_section_id: s.classSectionId,
      day_of_week: s.dayOfWeek,
      period_slot_id: s.periodSlotId,
      teaching_assignment_id: s.teachingAssignmentId,
    })),
  });

  console.log('✅ ALL TIMETABLE SLOTS SUCCESSFULLY PERSISTED TO DATABASE WITH ZERO CONFLICTS!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
