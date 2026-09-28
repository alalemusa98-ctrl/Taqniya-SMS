import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Rebalancing Teaching Load to Ensure No Teacher Exceeds Daily Limit ===');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Ensure TCH-109 (أ. كمال علي الفيتوري) exists
  let user109 = await prisma.user.findFirst({
    where: { user_code: 'TCH-109' },
  });

  if (!user109) {
    user109 = await prisma.user.create({
      data: {
        user_code: 'TCH-109',
        password: defaultPasswordHash,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });
    console.log('+ Created User: TCH-109');
  }

  let teacher109 = await prisma.teacher.findFirst({
    where: { user_id: user109.id },
  });

  if (!teacher109) {
    teacher109 = await prisma.teacher.create({
      data: {
        user_id: user109.id,
        full_name: 'أ. كمال علي الفيتوري',
        specialization: 'اللغة العربية والتربية الإسلامية',
        phone: '0911000109',
        hire_date: new Date('2025-09-01'),
      },
    });
    console.log(`+ Created Teacher Profile: ${teacher109.full_name} (ID: ${teacher109.id})`);
  }

  // 2. Re-assign Grade 8 Arabic, Islamic & Writing to TCH-109 (instead of TCH-108)
  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) return;

  const grade8 = await prisma.class.findFirst({
    where: { grade_level: 8, deleted_at: null },
    include: {
      class_sections: {
        where: { deleted_at: null },
      },
    },
  });

  const targetSubjects = await prisma.subject.findMany({
    where: {
      name: { in: ['التربية الإسلامية', 'اللغة العربية', 'الكتابة (الإملاء والخط والتعبير)', 'الكتابة'] },
      deleted_at: null,
    },
  });

  const subjectIds = targetSubjects.map((s) => s.id);

  if (grade8) {
    for (const cs of grade8.class_sections) {
      for (const subId of subjectIds) {
        const assignment = await prisma.teachingAssignment.findFirst({
          where: {
            academic_year_id: activeYear.id,
            class_section_id: cs.id,
            subject_id: subId,
          },
        });

        if (assignment) {
          await prisma.teachingAssignment.update({
            where: { id: assignment.id },
            data: {
              teacher_id: teacher109.id,
              deleted_at: null,
            },
          });
          console.log(`✓ Reassigned Grade 8 Section ${cs.id} Subject ${subId} to TCH-109 (${teacher109.full_name})`);
        } else {
          await prisma.teachingAssignment.create({
            data: {
              academic_year_id: activeYear.id,
              class_section_id: cs.id,
              subject_id: subId,
              teacher_id: teacher109.id,
            },
          });
          console.log(`+ Created Assignment Grade 8 Section ${cs.id} Subject ${subId} to TCH-109`);
        }
      }
    }
  }

  console.log('\n=== REBALANCING COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
