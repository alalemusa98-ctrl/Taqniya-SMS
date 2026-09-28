import { PrismaClient, RoleType, Gender, GuardianRelationship, EnrollmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'محمد', 'عبد الله', 'أحمد', 'علي', 'عمر', 'يوسف', 'طارق', 'حمزة',
  'إبراهيم', 'سالم', 'خالد', 'عبد الرحمن', 'محمود', 'أسامة', 'مصطفى', 'أنس',
  'بلال', 'مالك', 'إلياس', 'حسام', 'عبد العزيز', 'زياد', 'ياسين', 'معاذ',
  'سراج', 'حاتم', 'مهند', 'أيمن', 'كريم', 'سهيل', 'عثمان', 'صهيب',
  'رضوان', 'وليد', 'هيثم', 'راشد', 'وسام', 'مروان', 'غيث', 'قيس',
  'جاد', 'نادر', 'فاروق', 'بدر', 'سيف', 'أمين', 'مجد', 'عدنان'
];

const FATHER_NAMES = [
  'عبد الله', 'علي', 'محمد', 'سالم', 'فتحي', 'عبد السلام', 'ناصر', 'مصطفى',
  'فرج', 'سليمان', 'عبد الرحيم', 'جمعة', 'الهادي', 'رمضان', 'بشير', 'عاشور',
  'المنصف', 'الصادق', 'الطاهر', 'مختار', 'نور الدين', 'الصيد', 'مفتاح', 'خليفة',
  'بوبكر', 'السنوسي', 'فرحات', 'عصام', 'إسماعيل', 'صالح'
];

const FAMILY_NAMES = [
  'المحمودي', 'الفرجاني', 'الشريف', 'القماطي', 'الغرياني', 'الترهوني', 'الورفلي', 'المصراتي',
  'الزوي', 'المقرحي', 'الككلي', 'الدرسي', 'الساعدي', 'البوعيشي', 'المنفي', 'العبيدي',
  'الشعلالي', 'قنيدي', 'الرابطي', 'التاجوري', 'السويحلي', 'الأسطى', 'بن عثمان', 'الشيباني',
  'كعبار', 'الباروني', 'بازينة', 'الصالحين', 'الفيتوري', 'القرقني', 'الساحلي', 'العكاري',
  'بن يونس', 'بوشعالة', 'بن حمودة', 'بوقرين', 'الشاوش', 'البرغثي', 'الدوكالي', 'الرعيض'
];

// Target student counts per section (all between 15 and 25)
const SECTION_TARGETS: Record<number, number[]> = {
  1: [20, 19],         // Grade 1: Sec A (20), Sec B (19) -> Total 39
  2: [21, 20],         // Grade 2: Sec A (21), Sec B (20) -> Total 41
  3: [19, 22, 20],     // Grade 3: Sec A (19), Sec B (22), Sec C (20) -> Total 61
  4: [21, 20],         // Grade 4: Sec A (21), Sec B (20) -> Total 41
  5: [22, 21],         // Grade 5: Sec A (22), Sec B (21) -> Total 43
  6: [20, 21, 19],     // Grade 6: Sec A (20), Sec B (21), Sec C (19) -> Total 60
  7: [22, 21],         // Grade 7: Sec A (22), Sec B (21) -> Total 43
  8: [21, 22],         // Grade 8: Sec A (21), Sec B (22) -> Total 43
};

// Base birth year per grade (for academic year 2026-2027)
const GRADE_BIRTH_YEARS: Record<number, number> = {
  1: 2020,
  2: 2019,
  3: 2018,
  4: 2017,
  5: 2016,
  6: 2015,
  7: 2014,
  8: 2013,
};

async function main() {
  console.log('=== Seeding Students, Guardians & Enrollments (Grades 1 to 8) ===\n');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) {
    console.error('No active academic year found!');
    return;
  }

  console.log(`Academic Year: "${activeYear.name}" (ID: ${activeYear.id})\n`);

  const classes = await prisma.class.findMany({
    where: {
      deleted_at: null,
      grade_level: { in: [1, 2, 3, 4, 5, 6, 7, 8] },
      name: { not: 'التمهيدي' },
    },
    include: {
      class_sections: {
        where: { deleted_at: null },
        include: { section: true },
        orderBy: { section: { name: 'asc' } },
      },
      stage: true,
    },
    orderBy: { grade_level: 'asc' },
  });

  let globalStudentCounter = 1;
  let globalGuardianCounter = 1;
  let totalStudentsCreated = 0;
  let totalGuardiansCreated = 0;

  for (const cls of classes) {
    const grade = cls.grade_level;
    const targetCounts = SECTION_TARGETS[grade] || [20, 20];
    const birthYear = GRADE_BIRTH_YEARS[grade] || (2021 - grade);

    console.log(`\n🏫 Processing: ${cls.name} (Grade ${grade}) — ${cls.class_sections.length} Sections`);

    for (let sIdx = 0; sIdx < cls.class_sections.length; sIdx++) {
      const cs = cls.class_sections[sIdx];
      const count = targetCounts[sIdx] || 20;

      console.log(`  ▶ Section ${cs.section.name}: Generating ${count} students...`);

      for (let i = 1; i <= count; i++) {
        const studentCode = `STD-${String(globalStudentCounter).padStart(5, '0')}`;
        const guardianCode = `GRD-${String(globalGuardianCounter).padStart(5, '0')}`;
        const seatingNumber = `${grade}${sIdx + 1}${String(i).padStart(2, '0')}`;

        // Select random distinct names
        const fName = FIRST_NAMES[(globalStudentCounter * 7 + i) % FIRST_NAMES.length];
        const fatherName = FATHER_NAMES[(globalStudentCounter * 11 + i) % FATHER_NAMES.length];
        const famName = FAMILY_NAMES[(globalStudentCounter * 13 + i) % FAMILY_NAMES.length];
        const studentFullName = `${fName} ${fatherName} ${famName}`;
        const guardianFullName = `${fatherName} ${famName}`;

        const birthMonth = ((i * 3) % 12) + 1;
        const birthDay = ((i * 7) % 28) + 1;
        const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));

        const guardianPhone = `091${String(1000000 + globalGuardianCounter).padStart(7, '0')}`;
        const studentPhone = `092${String(2000000 + globalStudentCounter).padStart(7, '0')}`;

        // 1. Create Guardian User & Profile
        const guardianUser = await prisma.user.create({
          data: {
            user_code: guardianCode,
            password: defaultPasswordHash,
            role_type: RoleType.parent,
            is_active: 1,
          },
        });

        const guardian = await prisma.guardian.create({
          data: {
            user_id: guardianUser.id,
            full_name: guardianFullName,
            phone: guardianPhone,
            relationship: GuardianRelationship.father,
          },
        });
        totalGuardiansCreated++;

        // 2. Create Student User & Profile
        const studentUser = await prisma.user.create({
          data: {
            user_code: studentCode,
            password: defaultPasswordHash,
            role_type: RoleType.student,
            is_active: 1,
          },
        });

        const student = await prisma.student.create({
          data: {
            user_id: studentUser.id,
            full_name: studentFullName,
            birth_date: birthDate,
            gender: Gender.male,
            phone: studentPhone,
          },
        });
        totalStudentsCreated++;

        // 3. Link Guardian to Student
        await prisma.guardianStudent.create({
          data: {
            guardian_id: guardian.id,
            student_id: student.id,
            is_primary: 1,
          },
        });

        // 4. Enroll Student in Section for Active Academic Year
        await prisma.studentEnrollment.create({
          data: {
            academic_year_id: activeYear.id,
            student_id: student.id,
            class_id: cls.id,
            grade_level: grade,
            class_section_id: cs.id,
            seating_number: seatingNumber,
            status: EnrollmentStatus.enrolled,
          },
        });

        globalStudentCounter++;
        globalGuardianCounter++;
      }
    }
  }

  console.log('\n=============================================================');
  console.log(`🎉 COMPLETED SEEDING STUDENTS & ENROLLMENTS`);
  console.log(`- Total Students Created: ${totalStudentsCreated}`);
  console.log(`- Total Guardians Created: ${totalGuardiansCreated}`);
  console.log(`- Total Enrollments Created: ${totalStudentsCreated}`);
  console.log('=============================================================');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
