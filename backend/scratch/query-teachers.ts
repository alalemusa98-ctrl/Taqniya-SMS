import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.teacher.findMany({
    where: { deleted_at: null },
    include: {
      user: true,
      teaching_assignments: {
        where: { deleted_at: null },
      },
    },
  });

  console.log(`=== Existing Teachers (${teachers.length}) ===`);
  for (const t of teachers) {
    console.log(`- ID: ${t.id}, Name: "${t.full_name}", Specialization: "${t.specialization}", UserCode: "${t.user.user_code}"`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
