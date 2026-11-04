import { PrismaClient, RoleType, Gender, GuardianRelationship, EnrollmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// First and Last names to generate realistic Arabic names
const maleFirstNames = [
  'محمد', 'أحمد', 'علي', 'عمر', 'يوسف', 'إبراهيم', 'خالد', 'عبدالله', 'محمود', 'حمزة',
  'طارق', 'زياد', 'سيف', 'ياسين', 'سعود', 'سلطان', 'فيصل', 'فهد', 'عبدالرحمن', 'كريم',
  'حسام', 'مهند', 'بلال', 'أنس', 'وليد', 'ماجد', 'باسم', 'صالح', 'سالم', 'سامي',
  'نائل', 'فادي', 'جمال', 'معاذ', 'عثمان', 'حميد', 'حبيب', 'عصام', 'مروان', 'رائد'
];

const femaleFirstNames = [
  'فاطمة', 'مريم', 'عائشة', 'سارة', 'نور', 'هدى', 'شهد', 'ريم', 'ياسمين', 'ليلى',
  'زينب', 'رنا', 'منى', 'دينا', 'أروى', 'سلمى', 'هند', 'جنى', 'حنين', 'آية',
  'روان', 'تسنيم', 'داليا', 'براءة', 'رهف', 'ريماس', 'سندس', 'غادة', 'خلود', 'أسماء'
];

const lastNames = [
  'الغامدي', 'العتيبي', 'الشمري', 'الدوسري', 'القحطاني', 'الحربي', 'المطيري', 'الزهراني', 'الشهري', 'السبيعي',
  'العمري', 'القرني', 'المالكي', 'السيد', 'منصور', 'النجار', 'خليل', 'شعبان', 'رضوان', 'عاشور',
  'التركي', 'الحداد', 'الباشا', 'الصباغ', 'المصري', 'الباز', 'سليمان', 'عفيفي', 'إسماعيل', 'جاد',
  'الشوربجي', 'سلامة', 'حمودة', 'عطية', 'بدوي', 'المهدي', 'عزام', 'زهران', 'الجوهري', 'فرحات'
];

const specializations = [
  'اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم العامة', 'الحاسوب وتقنية المعلومات',
  'الفيزياء', 'الكيمياء', 'الأحياء', 'الدراسات الاجتماعية والتاريخ', 'الجغرافيا',
  'التربية الإسلامية', 'التربية الفنية', 'التربية البدنية'
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedTeachersAndStudents() {
  console.log('🚀 Starting Seeding of 50 Teachers and 20+ Students per Class Section...');

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1 },
  });

  if (!activeYear) {
    throw new Error('No active academic year found!');
  }

  const defaultPasswordHash = await bcrypt.hash('11223344', 10);

  // ===========================================================================
  // 1. Seed 50 Teachers
  // ===========================================================================
  console.log('👨‍🏫 Creating 50 Teachers...');
  const teacherUserPrefix = 'TCH-';
  const existingTeachersCount = await prisma.teacher.count();
  const teachersToCreate = 50;

  const createdTeachers: { id: bigint; full_name: string; specialization: string }[] = [];

  for (let i = 1; i <= teachersToCreate; i++) {
    const codeNumber = (1000 + existingTeachersCount + i).toString();
    const userCode = `${teacherUserPrefix}${codeNumber}`;
    const isMale = Math.random() > 0.4;
    const firstName = isMale ? getRandomItem(maleFirstNames) : getRandomItem(femaleFirstNames);
    const middleName = getRandomItem(maleFirstNames);
    const familyName = getRandomItem(lastNames);
    const fullName = `${firstName} ${middleName} ${familyName}`;
    const spec = getRandomItem(specializations);
    const phone = `05${Math.floor(10000000 + Math.random() * 90000000)}`;

    const user = await prisma.user.create({
      data: {
        user_code: userCode,
        password: defaultPasswordHash,
        role_type: RoleType.teacher,
        is_active: 1,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        user_id: user.id,
        full_name: fullName,
        phone: phone,
        specialization: spec,
        hire_date: new Date(2022, Math.floor(Math.random() * 12), 1),
      },
    });

    createdTeachers.push({
      id: teacher.id,
      full_name: teacher.full_name,
      specialization: spec,
    });
  }
  console.log(`✅ Successfully created ${createdTeachers.length} teachers (Logins: TCH-1001 to TCH-${1000 + existingTeachersCount + teachersToCreate}, password: 11223344).`);

  // ===========================================================================
  // 2. Assign Teachers to Class Sections (Teaching Assignments)
  // ===========================================================================
  console.log('📚 Distributing Teaching Assignments across class sections...');
  const classSections = await prisma.classSection.findMany({
    include: {
      class: {
        include: {
          class_subjects: {
            include: {
              subject: true,
            },
          },
        },
      },
      section: true,
    },
  });

  let assignedCount = 0;
  for (const cs of classSections) {
    // Unique subjects for this class
    const seenSubjects = new Set<bigint>();
    for (const csSubject of cs.class.class_subjects) {
      if (seenSubjects.has(csSubject.subject_id)) continue;
      seenSubjects.add(csSubject.subject_id);

      // Check if assignment already exists
      const existing = await prisma.teachingAssignment.findUnique({
        where: {
          academic_year_id_class_section_id_subject_id: {
            academic_year_id: activeYear.id,
            class_section_id: cs.id,
            subject_id: csSubject.subject_id,
          },
        },
      });

      if (!existing) {
        // Pick a teacher
        const assignedTeacher = getRandomItem(createdTeachers);
        await prisma.teachingAssignment.create({
          data: {
            academic_year_id: activeYear.id,
            class_section_id: cs.id,
            subject_id: csSubject.subject_id,
            teacher_id: assignedTeacher.id,
          },
        });
        assignedCount++;
      }
    }
  }
  console.log(`✅ Assigned ${assignedCount} teaching assignments (Subject + Section + Teacher).`);

  // ===========================================================================
  // 3. Seed Students (At least 20 per ClassSection) + Guardians
  // ===========================================================================
  console.log('🎓 Creating 20+ Students per ClassSection with Guardians and Enrollments...');
  const studentsPerSection = 20;
  let totalStudentsCreated = 0;
  let totalGuardiansCreated = 0;
  const existingStudentsCount = await prisma.student.count();
  const existingGuardiansCount = await prisma.guardian.count();

  let studentSeq = existingStudentsCount + 1;
  let guardianSeq = existingGuardiansCount + 1;

  for (const cs of classSections) {
    const classGrade = cs.class.grade_level;
    const baseBirthYear = 2026 - 5 - classGrade; // Appropriate age per grade

    for (let s = 1; s <= studentsPerSection; s++) {
      const studentCode = `STU-${(2000 + studentSeq).toString()}`;
      const isMale = Math.random() > 0.48;
      const studentFirstName = isMale ? getRandomItem(maleFirstNames) : getRandomItem(femaleFirstNames);
      const fatherFirstName = getRandomItem(maleFirstNames);
      const grandFatherName = getRandomItem(maleFirstNames);
      const familyName = getRandomItem(lastNames);
      const studentFullName = `${studentFirstName} ${fatherFirstName} ${grandFatherName} ${familyName}`;
      const guardianFullName = `${fatherFirstName} ${grandFatherName} ${familyName}`;

      // Create Guardian User & Profile
      const guardianCode = `PAR-${(3000 + guardianSeq).toString()}`;
      const guardianPhone = `05${Math.floor(10000000 + Math.random() * 90000000)}`;

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
      guardianSeq++;

      // Create Student User & Profile
      const studentUser = await prisma.user.create({
        data: {
          user_code: studentCode,
          password: defaultPasswordHash,
          role_type: RoleType.student,
          is_active: 1,
        },
      });

      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(1 + Math.random() * 28);
      const birthDate = new Date(baseBirthYear, birthMonth, birthDay);

      const student = await prisma.student.create({
        data: {
          user_id: studentUser.id,
          full_name: studentFullName,
          phone: `05${Math.floor(10000000 + Math.random() * 90000000)}`,
          birth_date: birthDate,
          gender: isMale ? Gender.male : Gender.female,
        },
      });

      // Link Guardian and Student
      await prisma.guardianStudent.create({
        data: {
          guardian_id: guardian.id,
          student_id: student.id,
          is_primary: 1,
        },
      });

      // Enroll Student in ClassSection
      const seatingNum = `${cs.class.grade_level}${cs.section.name.replace('شعبة ', '')}-${String(s).padStart(3, '0')}`;
      await prisma.studentEnrollment.create({
        data: {
          academic_year_id: activeYear.id,
          student_id: student.id,
          class_id: cs.class_id,
          grade_level: cs.class.grade_level,
          class_section_id: cs.id,
          seating_number: seatingNum,
          status: EnrollmentStatus.enrolled,
        },
      });

      totalStudentsCreated++;
      studentSeq++;
    }
  }

  console.log(`✅ Finished creating students and guardians!`);
  console.log(`📊 Total Sections populated: ${classSections.length}`);
  console.log(`📊 Total Students created & enrolled: ${totalStudentsCreated}`);
  console.log(`📊 Total Guardians created: ${totalGuardiansCreated}`);
  console.log(`🎉 Demo Data Generation Completed Successfully!`);
}

seedTeachersAndStudents()
  .catch((e) => {
    console.error('❌ Error during demo data generation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

