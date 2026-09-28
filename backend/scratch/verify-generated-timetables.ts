import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DAY_ARABIC: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
};

async function main() {
  console.log('=== Verifying Timetable Generation Integrity & Anti-Collision ===');

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) return;

  const allSlots = await prisma.timetableSlot.findMany({
    where: { academic_year_id: activeYear.id, deleted_at: null },
    include: {
      period_slot: true,
      teaching_assignment: {
        include: {
          teacher: true,
          subject: true,
        },
      },
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
      { day_of_week: 'asc' },
      { period_slot: { slot_number: 'asc' } },
    ],
  });

  console.log(`Total Timetable Slots in DB: ${allSlots.length}`);

  // 1. Teacher Collision Check
  const teacherCollisions = new Map<string, any[]>();
  for (const s of allSlots) {
    const key = `${s.teaching_assignment?.teacher_id}_${s.day_of_week}_${s.period_slot_id}`;
    if (!teacherCollisions.has(key)) teacherCollisions.set(key, []);
    teacherCollisions.get(key)!.push(s);
  }

  let teacherCollisionCount = 0;
  teacherCollisions.forEach((slots, key) => {
    if (slots.length > 1) {
      teacherCollisionCount++;
      console.error(`❌ Teacher Collision at ${key}: Teacher ${slots[0].teaching_assignment?.teacher?.full_name} is in ${slots.length} sections at once!`);
    }
  });

  // 2. Section Collision Check
  const sectionCollisions = new Map<string, any[]>();
  for (const s of allSlots) {
    const key = `${s.class_section_id}_${s.day_of_week}_${s.period_slot_id}`;
    if (!sectionCollisions.has(key)) sectionCollisions.set(key, []);
    sectionCollisions.get(key)!.push(s);
  }

  let sectionCollisionCount = 0;
  sectionCollisions.forEach((slots, key) => {
    if (slots.length > 1) {
      sectionCollisionCount++;
      console.error(`❌ Section Collision at ${key}: Section ${slots[0].class_section?.class?.name} (${slots[0].class_section?.section?.name}) has ${slots.length} subjects at once!`);
    }
  });

  // 3. Break Collision Check
  const breakCollisions = allSlots.filter((s) => s.period_slot?.is_break === 1);

  console.log('\n--- Collision Audit Report ---');
  console.log(`Teacher Collisions: ${teacherCollisionCount} (Expected: 0)`);
  console.log(`Section Collisions: ${sectionCollisionCount} (Expected: 0)`);
  console.log(`Break Slot Violations: ${breakCollisions.length} (Expected: 0)`);

  // 4. Section Summary
  const sectionCounts = new Map<string, number>();
  for (const s of allSlots) {
    const secName = `${s.class_section?.class?.name} (${s.class_section?.section?.name})`;
    sectionCounts.set(secName, (sectionCounts.get(secName) || 0) + 1);
  }

  console.log('\n--- Section Scheduling Completeness ---');
  sectionCounts.forEach((count, name) => {
    console.log(`✓ ${name}: ${count} حصص مجدولة`);
  });

  if (teacherCollisionCount === 0 && sectionCollisionCount === 0 && breakCollisions.length === 0) {
    console.log('\n🏆 AUDIT PASSED: ZERO CONFLICTS DETECTED ACROSS ALL SLOTS!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
