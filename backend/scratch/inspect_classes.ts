import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const classes = await prisma.class.findMany({
    include: {
      class_sections: {
        include: {
          section: true,
        },
      },
    },
  });
  console.log(`Classes count: ${classes.length}`);
  let totalSections = 0;
  for (const c of classes) {
    totalSections += c.class_sections.length;
    console.log(`- ${c.name} (Grade: ${c.grade_level}): ${c.class_sections.length} sections`);
  }
  console.log(`Total class_sections: ${totalSections}`);
  await prisma.$disconnect();
}

check();

