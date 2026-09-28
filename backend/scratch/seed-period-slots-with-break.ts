import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function timeToDate(timeStr: string): Date {
  return new Date(`1970-01-01T${timeStr}Z`);
}

async function main() {
  console.log('=== Configuring Period Slots with Break (الاستراحة المدرسية) ===');

  // Purge/Reset period slots safely
  await prisma.periodSlot.deleteMany({});

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
      name: 'الاستراحة المدرسية (الفسحة)',
      start_time: '10:15:00',
      end_time: '10:45:00',
      is_break: 1,
    },
    {
      slot_number: 5,
      name: 'الحصة الرابعة',
      start_time: '10:45:00',
      end_time: '11:30:00',
      is_break: 0,
    },
    {
      slot_number: 6,
      name: 'الحصة الخامسة',
      start_time: '11:30:00',
      end_time: '12:15:00',
      is_break: 0,
    },
    {
      slot_number: 7,
      name: 'الحصة السادسة',
      start_time: '12:15:00',
      end_time: '13:00:00',
      is_break: 0,
    },
  ];

  for (const s of slots) {
    const created = await prisma.periodSlot.create({
      data: {
        name: s.name,
        slot_number: s.slot_number,
        start_time: timeToDate(s.start_time),
        end_time: timeToDate(s.end_time),
        is_break: s.is_break,
      },
    });
    console.log(`+ [#${created.slot_number}] "${created.name}" (${s.start_time.substring(0,5)} - ${s.end_time.substring(0,5)}) [is_break=${created.is_break}, ID: ${created.id}]`);
  }

  console.log('\n=== Period Slots with Break Synchronized Successfully ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
