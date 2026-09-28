import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function timeToDate(timeStr: string): Date {
  return new Date(`1970-01-01T${timeStr}Z`);
}

async function main() {
  console.log('=== Creating 6 Daily Period Slots (Without Break) ===');

  const slots = [
    {
      slot_number: 1,
      name: 'الحصة الأولى',
      start_time: '08:00:00',
      end_time: '08:45:00',
      is_break: 0,
    },
    {
      slot_number: 2,
      name: 'الحصة الثانية',
      start_time: '08:45:00',
      end_time: '09:30:00',
      is_break: 0,
    },
    {
      slot_number: 3,
      name: 'الحصة الثالثة',
      start_time: '09:30:00',
      end_time: '10:15:00',
      is_break: 0,
    },
    {
      slot_number: 4,
      name: 'الحصة الرابعة',
      start_time: '10:15:00',
      end_time: '11:00:00',
      is_break: 0,
    },
    {
      slot_number: 5,
      name: 'الحصة الخامسة',
      start_time: '11:00:00',
      end_time: '11:45:00',
      is_break: 0,
    },
    {
      slot_number: 6,
      name: 'الحصة السادسة',
      start_time: '11:45:00',
      end_time: '12:30:00',
      is_break: 0,
    },
  ];

  for (const s of slots) {
    const existing = await prisma.periodSlot.findFirst({
      where: { slot_number: s.slot_number },
    });

    if (existing) {
      const updated = await prisma.periodSlot.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          start_time: timeToDate(s.start_time),
          end_time: timeToDate(s.end_time),
          is_break: s.is_break,
          deleted_at: null,
        },
      });
      console.log(`✓ Updated PeriodSlot #${s.slot_number}: "${updated.name}" (${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)}) [ID: ${updated.id}]`);
    } else {
      const created = await prisma.periodSlot.create({
        data: {
          name: s.name,
          slot_number: s.slot_number,
          start_time: timeToDate(s.start_time),
          end_time: timeToDate(s.end_time),
          is_break: s.is_break,
        },
      });
      console.log(`+ Created PeriodSlot #${s.slot_number}: "${created.name}" (${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)}) [ID: ${created.id}]`);
    }
  }

  // Remove any extra slot numbers beyond 6 if any
  const extra = await prisma.periodSlot.findMany({
    where: {
      slot_number: { gt: 6 },
      deleted_at: null,
    },
  });

  for (const ex of extra) {
    await prisma.periodSlot.update({
      where: { id: ex.id },
      data: { deleted_at: new Date() },
    });
    console.log(`- Removed extra slot #${ex.slot_number}: "${ex.name}"`);
  }

  console.log('\n=== All 6 Period Slots Created & Synchronized Successfully ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
