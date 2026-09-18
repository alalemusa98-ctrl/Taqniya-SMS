import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Clean & Professional Seeder for Taqniya-SMS...');

  // ===========================================================================
  // 1. Users & Identity (Phase 01)
  // ===========================================================================
  const defaultPassword = 'SecretPassword@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const userRequestedPassword = await bcrypt.hash('11223344', 10);

  const seedUsers = [
    {
      user_code: 'ADM-1001',
      password: hashedPassword,
      role_type: RoleType.admin,
      is_active: 1,
    },
    {
      user_code: 'TCH-2001',
      password: hashedPassword,
      role_type: RoleType.teacher,
      is_active: 1,
    },
    {
      user_code: 'STU-3001',
      password: hashedPassword,
      role_type: RoleType.student,
      is_active: 1,
    },
    {
      user_code: 'STU-3002',
      password: userRequestedPassword,
      role_type: RoleType.student,
      is_active: 1,
    },
    {
      user_code: 'PAR-4001',
      password: hashedPassword,
      role_type: RoleType.parent,
      is_active: 0,
    },
    {
      user_code: 'PAR-4002',
      password: userRequestedPassword,
      role_type: RoleType.parent,
      is_active: 0,
    },
  ];


  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { user_code: user.user_code },
      update: {
        password: user.password,
        role_type: user.role_type,
        is_active: user.is_active,
      },
      create: {
        user_code: user.user_code,
        password: user.password,
        role_type: user.role_type,
        is_active: user.is_active,
      },
    });
  }
  console.log('✅ Phase 01: Core users seeded.');

  // ===========================================================================
  // 2. Full Clean-up of Academic Tables (Cascading delete of test & extra data)
  // ===========================================================================
  console.log('🧹 Purging old & transient records for a fresh clean state...');

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  // Delete child relations across modules
  await prisma.teachingAssignment.deleteMany({});
  await prisma.studentEnrollment.deleteMany({});
  await prisma.guardianStudent.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.classSubject.deleteMany({});
  await prisma.classSection.deleteMany({});
  await prisma.classAcademicTerm.deleteMany({});

  // Delete entities
  await prisma.class.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.academicTerm.deleteMany({});
  await prisma.academicStage.deleteMany({});
  await prisma.academicYear.deleteMany({});

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  console.log('✅ Database reset complete.');

  // ===========================================================================
  // 3. Phase 02-A: Academic Years, Stages & Terms
  // ===========================================================================
  console.log('📚 Seeding Phase 02-A Academic Foundation...');

  // 3.1 Academic Years (2025-2026 Active, 2026-2027 Upcoming, 2024-2025 Previous)
  const activeYear = await prisma.academicYear.create({
    data: {
      name: '2025-2026',
      start_date: new Date('2025-09-01'),
      end_date: new Date('2026-06-30'),
      is_active: 1,
    },
  });

  await prisma.academicYear.create({
    data: {
      name: '2026-2027',
      start_date: new Date('2026-09-01'),
      end_date: new Date('2027-06-30'),
      is_active: 0,
    },
  });

  await prisma.academicYear.create({
    data: {
      name: '2024-2025',
      start_date: new Date('2024-09-01'),
      end_date: new Date('2025-06-30'),
      is_active: 0,
    },
  });
  console.log(`✅ Academic Years seeded. Active Year: ${activeYear.name}`);

  // 3.2 Academic Stages (Exactly 4 stages as requested)
  const stageData = [
    { name: 'مرحلة الروضة', order_index: 1 },
    { name: 'المرحلة الابتدائية', order_index: 2 },
    { name: 'المرحلة الإعدادية', order_index: 3 },
    { name: 'المرحلة الثانوية', order_index: 4 },
  ];

  const stagesMap: Record<string, bigint> = {};
  for (const s of stageData) {
    const created = await prisma.academicStage.create({
      data: s,
    });
    stagesMap[s.name] = created.id;
  }
  console.log('✅ Academic Stages seeded (4 stages: روضة، ابتدائي، إعدادي، ثانوي).');

  // 3.3 Academic Terms (Exactly 3 terms as requested)
  const termsData = [
    { name: 'الفصل الدراسي الأول', term_number: 1 },
    { name: 'الفصل الدراسي الثاني', term_number: 2 },
    { name: 'الفصل الدراسي الثالث', term_number: 3 },
  ];

  const termsMap: Record<number, bigint> = {};
  for (const t of termsData) {
    const created = await prisma.academicTerm.create({
      data: t,
    });
    termsMap[t.term_number] = created.id;
  }
  console.log('✅ Academic Terms seeded (3 terms: الأول، الثاني، الثالث).');

  // ===========================================================================
  // 4. Phase 02-B: Classes (10 only), Sections (4 only) & Subjects
  // ===========================================================================
  console.log('🏫 Seeding Phase 02-B Classes, Sections & Subjects...');

  // 4.1 Master Sections Catalog (Exactly 4 sections: أ، ب، ج، د)
  const sectionsData = [
    { name: 'شعبة (أ)' },
    { name: 'شعبة (ب)' },
    { name: 'شعبة (ج)' },
    { name: 'شعبة (د)' },
  ];

  const sectionsList: { id: bigint; name: string }[] = [];
  for (const sec of sectionsData) {
    const created = await prisma.section.create({
      data: sec,
    });
    sectionsList.push({ id: created.id, name: created.name });
  }
  console.log('✅ Master Sections Catalog seeded (4 sections: أ، ب، ج، د).');

  // 4.2 Academic Classes (Exactly 10 classes as requested: تمهيدي + 1 إلى 9)
  const classesData = [
    // Kindergarten
    { stage_name: 'مرحلة الروضة', name: 'الصف التمهيدي', grade_level: 1 },

    // Primary (1 to 6)
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الأول الابتدائي', grade_level: 1 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الثاني الابتدائي', grade_level: 2 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الثالث الابتدائي', grade_level: 3 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الرابع الابتدائي', grade_level: 4 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الخامس الابتدائي', grade_level: 5 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف السادس الابتدائي', grade_level: 6 },

    // Preparatory (7 to 9)
    { stage_name: 'المرحلة الإعدادية', name: 'الصف السابع', grade_level: 7 },
    { stage_name: 'المرحلة الإعدادية', name: 'الصف الثامن', grade_level: 8 },
    { stage_name: 'المرحلة الإعدادية', name: 'الصف التاسع', grade_level: 9 },
  ];

  const classesList: { id: bigint; name: string }[] = [];
  for (const c of classesData) {
    const stageId = stagesMap[c.stage_name];
    const created = await prisma.class.create({
      data: {
        stage_id: stageId,
        name: c.name,
        grade_level: c.grade_level,
      },
    });
    classesList.push({ id: created.id, name: created.name });
  }
  console.log('✅ Academic Classes seeded (10 classes: التمهيدي ومن 1 إلى 9).');

  // 4.3 Master Subjects Catalog (Standard School Curriculum)
  const subjectsData = [
    { name: 'القرآن الكريم والتربية الإسلامية', code: 'ISLAM' },
    { name: 'اللغة العربية', code: 'ARAB' },
    { name: 'الرياضيات', code: 'MATH' },
    { name: 'العلوم العامة', code: 'SCI' },
    { name: 'اللغة الإنجليزية', code: 'ENG' },
    { name: 'الدراسات الاجتماعية', code: 'SOC' },
    { name: 'تقنية المعلومات والحاسوب', code: 'IT' },
    { name: 'التربية البدنية', code: 'PE' },
    { name: 'التربية الفنية', code: 'ART' },
  ];

  const subjectsList: { id: bigint; name: string }[] = [];
  for (const sub of subjectsData) {
    const created = await prisma.subject.create({
      data: sub,
    });
    subjectsList.push({ id: created.id, name: created.name });
  }
  console.log('✅ Master Subjects Catalog seeded (9 official subjects).');

  // ===========================================================================
  // 5. Phase 02-C: Class Terms, Sections Assignment & Curriculum Subjects
  // ===========================================================================
  console.log('🔗 Seeding Phase 02-C Assignments & Structure...');

  for (const cls of classesList) {
    // 5.1 Assign Terms: Term 1 (Active), Term 2, Term 3
    const term1 = await prisma.classAcademicTerm.create({
      data: {
        class_id: cls.id,
        academic_term_id: termsMap[1],
        is_active: 1,
        is_closed: 0,
      },
    });

    await prisma.classAcademicTerm.create({
      data: {
        class_id: cls.id,
        academic_term_id: termsMap[2],
        is_active: 0,
        is_closed: 0,
      },
    });

    await prisma.classAcademicTerm.create({
      data: {
        class_id: cls.id,
        academic_term_id: termsMap[3],
        is_active: 0,
        is_closed: 0,
      },
    });

    // 5.2 Assign Sections: Assign شعبة (أ) and شعبة (ب) to each class
    await prisma.classSection.create({
      data: {
        class_id: cls.id,
        section_id: sectionsList[0].id, // شعبة (أ)
      },
    });

    await prisma.classSection.create({
      data: {
        class_id: cls.id,
        section_id: sectionsList[1].id, // شعبة (ب)
      },
    });

    // For some classes (like 1st and 2nd primary), also assign شعبة (ج)
    if (cls.name.includes('الأول') || cls.name.includes('الثاني')) {
      await prisma.classSection.create({
        data: {
          class_id: cls.id,
          section_id: sectionsList[2].id, // شعبة (ج)
        },
      });
    }

    // 5.3 Assign Core Subjects for Term 1
    // Primary & Prep subjects
    const subjectsToAssign = subjectsList.slice(0, 7); // First 7 subjects (Islam, Arabic, Math, Science, English, Social, IT)
    for (const sub of subjectsToAssign) {
      await prisma.classSubject.create({
        data: {
          class_id: cls.id,
          class_academic_term_id: term1.id,
          subject_id: sub.id,
          passing_score: 50.0,
          max_score: 100.0,
        },
      });
    }
  }

  console.log('✅ Phase 02-C: Class terms, sections & curriculum subjects seeded realistically.');
  console.log('🎉 Database is now completely clean, structured, and compliant!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
