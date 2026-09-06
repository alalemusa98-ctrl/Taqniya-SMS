import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive Seeder for Taqniya-SMS...');

  // ===========================================================================
  // 1. Users & Identity (Phase 01)
  // ===========================================================================
  const defaultPassword = 'SecretPassword@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

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
      user_code: 'PAR-4001',
      password: hashedPassword,
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
  // 2. Clean temporary/automated test artifact records
  // ===========================================================================
  console.log('🧹 Cleaning transient automated test artifacts...');

  await prisma.class.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'Class-' } },
        { name: { startsWith: 'UpdatedClass-' } },
        { name: { startsWith: 'DuplicateLevelClass-' } },
        { name: { startsWith: 'ClassToDel-' } },
      ],
    },
  });

  await prisma.section.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'شعبة-' } },
        { name: { startsWith: 'شعبة-محدثة-' } },
        { name: { startsWith: 'شعبة-للحذف-' } },
      ],
    },
  });

  await prisma.subject.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'مادة-' } },
        { name: { startsWith: 'مادة-معدلة-' } },
        { name: { startsWith: 'مادة-للحذف-' } },
        { name: { startsWith: 'اسم-مختلف-' } },
      ],
    },
  });

  await prisma.academicStage.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'Stage-Phase02B-' } },
        { name: { startsWith: 'Stage-' } },
        { name: { startsWith: 'UpdatedStage-' } },
        { name: { startsWith: 'DelStage-' } },
      ],
    },
  });

  await prisma.academicTerm.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'Term-' } },
        { name: { startsWith: 'UpdatedTerm-' } },
        { name: { startsWith: 'DelTerm-' } },
      ],
    },
  });

  await prisma.academicYear.deleteMany({
    where: {
      OR: [
        { name: { startsWith: 'TestYear-' } },
        { name: { startsWith: 'SecondYear-' } },
        { name: { startsWith: 'Updated-' } },
        { name: { startsWith: 'ToDelete-' } },
      ],
    },
  });

  // ===========================================================================
  // 3. Phase 02-A: Academic Years, Terms & Stages (Real Educational Data)
  // ===========================================================================
  console.log('📚 Seeding Phase 02-A Real Educational Foundation...');

  // 3.1 Academic Years
  await prisma.academicYear.updateMany({ data: { is_active: 0 } });

  const year2526 = await prisma.academicYear.upsert({
    where: { name: '2025-2026' },
    update: {
      start_date: new Date('2025-09-01'),
      end_date: new Date('2026-06-30'),
      is_active: 1,
      deleted_at: null,
    },
    create: {
      name: '2025-2026',
      start_date: new Date('2025-09-01'),
      end_date: new Date('2026-06-30'),
      is_active: 1,
    },
  });

  await prisma.academicYear.upsert({
    where: { name: '2024-2025' },
    update: {
      start_date: new Date('2024-09-01'),
      end_date: new Date('2025-06-30'),
      is_active: 0,
      deleted_at: null,
    },
    create: {
      name: '2024-2025',
      start_date: new Date('2024-09-01'),
      end_date: new Date('2025-06-30'),
      is_active: 0,
    },
  });
  console.log(`✅ Academic Years seeded. Active: ${year2526.name}`);

  // 3.2 Master Terms Catalog
  const termsData = [
    { term_number: 1, name: 'الفصل الدراسي الأول' },
    { term_number: 2, name: 'الفصل الدراسي الثاني' },
    { term_number: 3, name: 'الفصل الدراسي الثالث / الصيفي' },
  ];

  for (const term of termsData) {
    await prisma.academicTerm.upsert({
      where: { term_number: term.term_number },
      update: { name: term.name, deleted_at: null },
      create: { term_number: term.term_number, name: term.name },
    });
  }
  console.log('✅ Academic Terms Master Catalog seeded.');

  // 3.3 Academic Stages
  const stagesData = [
    { name: 'مرحلة الروضة والتعليم المبكر', order_index: 1 },
    { name: 'المرحلة الابتدائية', order_index: 2 },
    { name: 'المرحلة الإعدادية', order_index: 3 },
    { name: 'المرحلة الثانوية', order_index: 4 },
  ];

  const createdStages: Record<string, bigint> = {};
  for (const stage of stagesData) {
    const s = await prisma.academicStage.upsert({
      where: { name: stage.name },
      update: { order_index: stage.order_index, deleted_at: null },
      create: { name: stage.name, order_index: stage.order_index },
    });
    createdStages[stage.name] = s.id;
  }
  console.log('✅ Academic Stages seeded.');

  // ===========================================================================
  // 4. Phase 02-B: Classes, Master Sections & Master Subjects
  // ===========================================================================
  console.log('🏫 Seeding Phase 02-B Classes, Sections & Subjects...');

  // 4.1 Classes Definition
  const classesDefinitions = [
    // Kindergarten
    { stage_name: 'مرحلة الروضة والتعليم المبكر', name: 'الصف التمهيدي', grade_level: 1 },

    // Primary
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الأول الابتدائي', grade_level: 1 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الثاني الابتدائي', grade_level: 2 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الثالث الابتدائي', grade_level: 3 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الرابع الابتدائي', grade_level: 4 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الخامس الابتدائي', grade_level: 5 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف السادس الابتدائي', grade_level: 6 },

    // Preparatory (Middle School)
    { stage_name: 'المرحلة الإعدادية', name: 'الصف الأول الإعدادي (السابع)', grade_level: 7 },
    { stage_name: 'المرحلة الإعدادية', name: 'الصف الثاني الإعدادي (الثامن)', grade_level: 8 },
    { stage_name: 'المرحلة الإعدادية', name: 'الصف الثالث الإعدادي (التاسع)', grade_level: 9 },

    // Secondary (High School)
    { stage_name: 'المرحلة الثانوية', name: 'الصف الأول الثانوي (العاشر)', grade_level: 10 },
    { stage_name: 'المرحلة الثانوية', name: 'الصف الثاني الثانوي (الحادي عشر)', grade_level: 11 },
    { stage_name: 'المرحلة الثانوية', name: 'الصف الثالث الثانوي (الشهادة الثانوية)', grade_level: 12 },
  ];

  for (const c of classesDefinitions) {
    const stageId = createdStages[c.stage_name];
    if (stageId) {
      await prisma.class.upsert({
        where: {
          stage_id_grade_level: {
            stage_id: stageId,
            grade_level: c.grade_level,
          },
        },
        update: {
          name: c.name,
          deleted_at: null,
        },
        create: {
          stage_id: stageId,
          name: c.name,
          grade_level: c.grade_level,
        },
      });
    }
  }
  console.log('✅ Academic Classes seeded across all educational stages.');

  // 4.2 Master Sections Catalog
  const sectionsData = [
    { name: 'شعبة (أ)' },
    { name: 'شعبة (ب)' },
    { name: 'شعبة (ج)' },
    { name: 'شعبة (د)' },
  ];

  for (const sec of sectionsData) {
    await prisma.section.upsert({
      where: { name: sec.name },
      update: { deleted_at: null },
      create: { name: sec.name },
    });
  }
  console.log('✅ Master Sections Catalog seeded (أ، ب، ج، د).');

  // 4.3 Master Subjects Catalog (Official Curriculum)
  const subjectsData = [
    { name: 'القرآن الكريم والتربية الإسلامية', code: 'ISLAM' },
    { name: 'اللغة العربية وفروعها', code: 'ARAB' },
    { name: 'الرياضيات', code: 'MATH' },
    { name: 'العلوم العامة', code: 'SCI' },
    { name: 'اللغة الإنجليزية', code: 'ENG' },
    { name: 'الدراسات الاجتماعية (تاريخ وجغرافيا)', code: 'SOC' },
    { name: 'تقنية المعلومات والحاسوب', code: 'IT' },
    { name: 'التربية البدنية والرياضية', code: 'PE' },
    { name: 'التربية الفنية', code: 'ART' },
    { name: 'الإحصاء', code: 'STAT' },
    { name: 'الفيزياء', code: 'PHYS' },
    { name: 'الكيمياء', code: 'CHEM' },
    { name: 'الأحياء', code: 'BIO' },
  ];

  for (const sub of subjectsData) {
    await prisma.subject.upsert({
      where: { name: sub.name },
      update: { code: sub.code, deleted_at: null },
      create: { name: sub.name, code: sub.code },
    });
  }
  console.log('✅ Master Subjects Catalog seeded with Libyan & standard school curriculum.');

  console.log('🎉 All educational seed data generated with clean, professional values!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
