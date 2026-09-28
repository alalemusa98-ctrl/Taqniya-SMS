import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slots = await prisma.periodSlot.findMany({
    orderBy: { slot_number: 'asc' },
  });
  console.log(`=== Existing Period Slots in DB (${slots.length}) ===`);
  for (const s of slots) {
    console.log(`- #${s.slot_number}: "${s.name}" (${s.start_time.toISOString().substring(11, 16)} -> ${s.end_time.toISOString().substring(11, 16)}), is_break=${s.is_break}, deleted=${s.deleted_at}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
