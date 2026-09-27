import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Complete Database Wipe & Clean Seeding for Taqniya-SMS...');

  // ===========================================================================
  // 1. Full Clean-up of All Database Tables (Foreign Key Safe)
  // ===========================================================================
  console.log('🧹 Purging all existing records from database...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'audit_logs',
    'personal_access_tokens',
    'assignment_submissions',
    'assignments',
    'quiz_results',
    'quizzes',
    'official_exams',
    'promotion_records',
    'promotion_batches',
    'annual_transcripts',
    'term_transcripts',
    'timetable_periods',
    'period_slots',
    'teaching_assignments',
    'student_enrollments',
    'guardian_students',
    'students',
    'guardians',
    'teachers',
    'class_subjects',
    'class_sections',
    'class_academic_terms',
    'classes',
    'sections',
    'subjects',
    'academic_terms',
    'academic_stages',
    'academic_years',
    'users',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
    } catch (e) {
      // Table might not exist or already empty, ignore
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('✅ Database purged completely.');

  // ===========================================================================
  // 1.1 Clean up storage/uploads directory
  // ===========================================================================
  const uploadsDir = path.resolve(process.cwd(), 'storage', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log('🧹 Cleaning up storage/uploads folder...');
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Storage uploads directory refreshed.');
  }

  // ===========================================================================
  // 2. Core Admin Users Creation
  // ===========================================================================
  console.log('👤 Seeding Super Admin accounts...');
  const pass1 = await bcrypt.hash('SecretAdminPass123!', 10);
  const pass2 = await bcrypt.hash('11223344', 10);
  const pass3 = await bcrypt.hash('SecretPassword@123', 10);

  // Default admin accounts for user convenience
  const adminUsers = [
    { user_code: 'ADM-0001', password: pass1, role_type: RoleType.admin, is_active: 1 },
    { user_code: 'ADM-1001', password: pass2, role_type: RoleType.admin, is_active: 1 },
    { user_code: 'admin', password: pass2, role_type: RoleType.admin, is_active: 1 },
  ];

  for (const u of adminUsers) {
    await prisma.user.create({
      data: u,
    });
  }
  console.log('✅ Admin accounts created: ADM-0001 (SecretAdminPass123!), ADM-1001 (11223344), admin (11223344).');

  // ===========================================================================
  // 3. Academic Year (سنة 2026-2027 فقط فعلية)
  // ===========================================================================
  console.log('📅 Seeding Academic Year 2026-2027...');
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2026-2027',
      start_date: new Date('2026-09-01'),
      end_date: new Date('2027-06-30'),
      is_active: 1,
    },
  });
  console.log(`✅ Active Academic Year created: ${academicYear.name} (ID: ${academicYear.id})`);

  // ===========================================================================
  // 4. Academic Stages (الروضة، الابتدائي، الإعدادي، الثانوي)
  // ===========================================================================
  console.log('🏛️ Seeding Educational Stages...');
  const stagesData = [
    { name: 'مرحلة الروضة', order_index: 1 },
    { name: 'المرحلة الابتدائية', order_index: 2 },
    { name: 'المرحلة الإعدادية', order_index: 3 },
    { name: 'المرحلة الثانوية', order_index: 4 },
  ];

  const stagesMap = new Map<string, bigint>();
  for (const s of stagesData) {
    const created = await prisma.academicStage.create({ data: s });
    stagesMap.set(s.name, created.id);
  }
  console.log('✅ Stages created: الروضة، الابتدائي، الإعدادي، الثانوي.');

  // ===========================================================================
  // 5. Academic Terms (الفصل الأول، الفصل الثاني، الفصل الثالث)
  // ===========================================================================
  console.log('📆 Seeding Academic Terms (3 terms)...');
  const termsData = [
    { name: 'الفصل الدراسي الأول', term_number: 1 },
    { name: 'الفصل الدراسي الثاني', term_number: 2 },
    { name: 'الفصل الدراسي الثالث', term_number: 3 },
  ];

  const termsList: { id: bigint; name: string; term_number: number }[] = [];
  for (const t of termsData) {
    const created = await prisma.academicTerm.create({ data: t });
    termsList.push(created);
  }
  console.log('✅ Academic Terms created (الأول، الثاني، الثالث).');

  // ===========================================================================
  // 6. Master Sections Catalog (بنك الشعب: أ، ب، ج، د)
  // ===========================================================================
  console.log('🏢 Seeding Master Sections Catalog (أ، ب، ج، د)...');
  const sectionsData = [
    { name: 'شعبة أ' },
    { name: 'شعبة ب' },
    { name: 'شعبة ج' },
    { name: 'شعبة د' },
  ];

  const sectionsList: { id: bigint; name: string }[] = [];
  for (const sec of sectionsData) {
    const created = await prisma.section.create({ data: sec });
    sectionsList.push(created);
  }
  console.log('✅ Master Sections Catalog created (شعبة أ، شعبة ب، شعبة ج، شعبة د).');

  // ===========================================================================
  // 7. Master Classes (الصفوف الدراسية بالأسماء المعتمدة الجديدة)
  // ===========================================================================
  console.log('🏫 Seeding Master Classes with custom names...');
  const classesConfig = [
    // Kindergarten
    { stage_name: 'مرحلة الروضة', name: 'التمهيدي', grade_level: 1 },

    // Primary (1 to 6)
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الأول الابتدائي', grade_level: 1 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الثاني الابتدائي', grade_level: 2 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الثالث الابتدائي', grade_level: 3 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الرابع الابتدائي', grade_level: 4 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف الخامس الابتدائي', grade_level: 5 },
    { stage_name: 'المرحلة الابتدائية', name: 'الصف السادس الابتدائي', grade_level: 6 },

    // Preparatory (1 to 3 Middle / Prep)
    { stage_name: 'المرحلة الإعدادية', name: 'الصف الأول الإعدادي', grade_level: 7 },
    { stage_name: 'المرحلة الإعدادية', name: 'الصف الثاني الإعدادي', grade_level: 8 },
    { stage_name: 'المرحلة الإعدادية', name: 'الصف الثالث الإعدادي', grade_level: 9 },

    // Secondary (1 to 3 Secondary / High)
    { stage_name: 'المرحلة الثانوية', name: 'الصف الأول الثانوي', grade_level: 10 },
    { stage_name: 'المرحلة الثانوية', name: 'الصف الثاني الثانوي', grade_level: 11 },
    { stage_name: 'المرحلة الثانوية', name: 'الصف الثالث الثانوي', grade_level: 12 },
  ];

  const classesList: { id: bigint; name: string; stage_name: string }[] = [];
  for (const c of classesConfig) {
    const stageId = stagesMap.get(c.stage_name)!;
    const created = await prisma.class.create({
      data: {
        stage_id: stageId,
        name: c.name,
        grade_level: c.grade_level,
      },
    });
    classesList.push({ id: created.id, name: created.name, stage_name: c.stage_name });
  }
  console.log(`✅ Master Classes created (${classesList.length} صفاً من التمهيدي حتى الثالث الثانوي).`);

  // ===========================================================================
  // 8. Master Subjects Catalog (المواد الدراسية الثمانية المحددة)
  // ===========================================================================
  console.log('📖 Seeding Master Subjects Catalog (8 subjects)...');
  const subjectsData = [
    { name: 'اللغة العربية', code: 'ARAB' },
    { name: 'اللغة الإنجليزية', code: 'ENG' },
    { name: 'العلوم', code: 'SCI' },
    { name: 'الرياضيات', code: 'MATH' },
    { name: 'الحاسوب', code: 'IT' },
    { name: 'الجغرافيا', code: 'GEO' },
    { name: 'التربية الإسلامية', code: 'ISLAM' },
    { name: 'التاريخ', code: 'HIST' },
  ];

  const subjectsList: { id: bigint; name: string; code: string }[] = [];
  for (const sub of subjectsData) {
    const created = await prisma.subject.create({ data: sub });
    subjectsList.push(created);
  }
  console.log('✅ Master Subjects created: اللغة العربية، اللغة الإنجليزية، العلوم، الرياضيات، الحاسوب، الجغرافيا، التربية الإسلامية، التاريخ.');

  // ===========================================================================
  // 9. Assigning Terms, Sections & Core Subjects to Classes (Phase 02-C)
  // ===========================================================================
  console.log('🔗 Linking Classes to Terms, Sections, and Subjects...');

  for (const cls of classesList) {
    // 9.1 Link all 3 terms to each class (Term 1 is Active)
    const term1Link = await prisma.classAcademicTerm.create({
      data: {
        class_id: cls.id,
        academic_term_id: termsList[0].id,
        is_active: 1,
        is_closed: 0,
      },
    });

    await prisma.classAcademicTerm.create({
      data: {
        class_id: cls.id,
        academic_term_id: termsList[1].id,
        is_active: 0,
        is_closed: 0,
      },
    });

    await prisma.classAcademicTerm.create({
      data: {
        class_id: cls.id,
        academic_term_id: termsList[2].id,
        is_active: 0,
        is_closed: 0,
      },
    });

    // 9.2 Link standard sections (شعبة أ وشعبة ب) to each class
    await prisma.classSection.create({
      data: {
        class_id: cls.id,
        section_id: sectionsList[0].id, // شعبة أ
      },
    });

    await prisma.classSection.create({
      data: {
        class_id: cls.id,
        section_id: sectionsList[1].id, // شعبة ب
      },
    });

    // 9.3 Assign subjects to Term 1 of this class
    for (const sub of subjectsList) {
      // Kindergarten takes Arabic, Math, Islamic, English
      if (cls.stage_name === 'مرحلة الروضة') {
        if (!['ARAB', 'MATH', 'ISLAM', 'ENG'].includes(sub.code)) continue;
      }
      // Primary 1-3 does not take separate History/Geography
      if (['الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي'].includes(cls.name)) {
        if (['GEO', 'HIST'].includes(sub.code)) continue;
      }

      await prisma.classSubject.create({
        data: {
          class_id: cls.id,
          class_academic_term_id: term1Link.id,
          subject_id: sub.id,
          passing_score: 50.0,
          max_score: 100.0,
        },
      });
    }
  }

  console.log('✅ Structure links completed successfully!');
  console.log('🎉 Setup complete! All data is fresh, clean, and customized.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
