import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    where: {
      deleted_at: null,
    },
    include: {
      class_sections: {
        where: { deleted_at: null },
        include: {
          section: true,
        },
      },
      stage: true,
    },
    orderBy: [
      { grade_level: 'asc' },
      { id: 'asc' },
    ],
  });

  console.log('=== Classes and Sections in Database ===');
  for (const c of classes) {
    console.log(`\nالصف: ${c.name} (Grade Level: ${c.grade_level}, المرحلة: ${c.stage?.name || 'غير محدد'}, ID: ${c.id})`);
    console.log(`عدد الشعب: ${c.class_sections.length}`);
    if (c.class_sections.length > 0) {
      c.class_sections.forEach((cs) => {
        console.log(`   - شعبة: "${cs.section.name}" (كود: ${cs.section.code || 'لا يوجد'}, Section ID: ${cs.section.id}, ClassSection ID: ${cs.id}, السعة: ${cs.max_capacity || 'غير محدد'})`);
      });
    } else {
      console.log('   (لا توجد شُعب مرتبطة)');
    }
  }

  const allSections = await prisma.section.findMany({
    where: { deleted_at: null },
  });
  console.log('\n=== All Sections in Section Table ===');
  for (const s of allSections) {
    console.log(`- Section: "${s.name}" (Code: ${s.code}, ID: ${s.id})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
