import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    where: { deleted_at: null },
    include: {
      class_sections: {
        where: { deleted_at: null },
        include: {
          section: true,
          student_enrollments: {
            where: { deleted_at: null },
          },
        },
      },
      stage: true,
    },
    orderBy: [
      { grade_level: 'asc' },
      { id: 'asc' },
    ],
  });

  console.log('=== Student Counts per Section ===');
  for (const c of classes) {
    const totalStudents = c.class_sections.reduce((sum, cs) => sum + cs.student_enrollments.length, 0);
    console.log(`\n${c.name} (${c.stage?.name || ''}) -> إجمالي الطلاب: ${totalStudents}`);
    for (const cs of c.class_sections) {
      console.log(`   - ${cs.section.name}: ${cs.student_enrollments.length} طالب`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
