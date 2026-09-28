import { PrismaClient, RoleType, Gender, GuardianRelationship, EnrollmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'محمد', 'عبد الله', 'أحمد', 'علي', 'عمر', 'يوسف', 'طارق', 'حمزة',
  'إبراهيم', 'سالم', 'خالد', 'عبد الرحمن', 'محمود', 'أسامة', 'مصطفى', 'أنس',
  'بلال', 'مالك', 'إلياس', 'حسام', 'عبد العزيز', 'زياد', 'ياسين', 'معاذ',
  'سراج', 'حاتم', 'مهند', 'أيمن', 'كريم', 'سهيل', 'عثمان', 'صهيب',
  'رضوان', 'وليد', 'هيثم', 'راشد', 'وسام', 'مروان', 'غيث', 'قيس',
  'جاد', 'نادر', 'فاروق', 'بدر', 'سيف', 'أمين', 'مجد', 'عدنان',
  'فارس', 'مازن', 'تيم', 'جاد الله', 'صالح', 'معتصم', 'بشير', 'منير'
];

const FATHER_NAMES = [
  'عبد الله', 'علي', 'محمد', 'سالم', 'فتحي', 'عبد السلام', 'ناصر', 'مصطفى',
  'فرج', 'سليمان', 'عبد الرحيم', 'جمعة', 'الهادي', 'رمضان', 'بشير', 'عاشور',
  'المنصف', 'الصادق', 'الطاهر', 'مختار', 'نور الدين', 'الصيد', 'مفتاح', 'خليفة',
  'بوبكر', 'السنوسي', 'فرحات', 'عصام', 'إسماعيل', 'صالح', 'شكري', 'فوزي'
];

const FAMILY_NAMES = [
  'المحمودي', 'الفرجاني', 'الشريف', 'القماطي', 'الغرياني', 'الترهوني', 'الورفلي', 'المصراتي',
  'الزوي', 'المقرحي', 'الككلي', 'الدرسي', 'الساعدي', 'البوعيشي', 'المنفي', 'العبيدي',
  'الشعلالي', 'قنيدي', 'الرابطي', 'التاجوري', 'السويحلي', 'الأسطى', 'بن عثمان', 'الشيباني',
  'كعبار', 'الباروني', 'بازينة', 'الصالحين', 'الفيتوري', 'القرقني', 'الساحلي', 'العكاري',
  'بن يونس', 'بوشعالة', 'بن حمودة', 'بوقرين', 'الشاوش', 'البرغثي', 'الدوكالي', 'الرعيض',
  'الرياني', 'الطرابلسي', 'الرقيعي', 'اليعقوبي', 'الفطيسي', 'الزواري', 'الحمروني'
];

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

interface StudentSlot {
  grade: number;
  classId: bigint;
  classSectionId: bigint;
  sectionIndex: number;
  sectionName: string;
  studentIndexInSection: number;
}

interface FamilyPlan {
  fatherName: string;
  familyName: string;
  guardianPhone: string;
  guardianCode: string;
  children: {
    slot: StudentSlot;
    firstName: string;
  }[];
}

async function main() {
  console.log('=== Seeding Students & Guardians with Realistic Sibling Relationships ===\n');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const activeYear = await prisma.academicYear.findFirst({
    where: { is_active: 1, deleted_at: null },
  });

  if (!activeYear) {
    console.error('No active academic year found!');
    return;
  }

  // 1. Clean existing student/guardian data cleanly
  console.log('🧹 Cleaning previous student and guardian seed data...');
  await prisma.studentEnrollment.deleteMany({});
  await prisma.guardianStudent.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.user.deleteMany({
    where: { role_type: { in: [RoleType.student, RoleType.parent] } },
  });
  console.log('✓ Cleaned successfully.\n');

  // 2. Fetch classes & class_sections
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
    },
    orderBy: { grade_level: 'asc' },
  });

  // 3. Build array of all available student slots across sections
  const allSlots: StudentSlot[] = [];
  const slotsByGrade: Record<number, StudentSlot[]> = {};

  for (const cls of classes) {
    const grade = cls.grade_level;
    slotsByGrade[grade] = [];
    const targets = SECTION_TARGETS[grade] || [20, 20];

    for (let sIdx = 0; sIdx < cls.class_sections.length; sIdx++) {
      const cs = cls.class_sections[sIdx];
      const count = targets[sIdx] || 20;

      for (let i = 1; i <= count; i++) {
        const slot: StudentSlot = {
          grade,
          classId: cls.id,
          classSectionId: cs.id,
          sectionIndex: sIdx + 1,
          sectionName: cs.section.name,
          studentIndexInSection: i,
        };
        allSlots.push(slot);
        slotsByGrade[grade].push(slot);
      }
    }
  }

  console.log(`Total Student Slots to Populate: ${allSlots.length} across 18 sections.\n`);

  // 4. Plan Families (3-sibling families, 2-sibling families, 1-child families)
  const families: FamilyPlan[] = [];
  let guardianCounter = 1;

  // Helper to pick names
  const getFamilyNames = (index: number) => {
    const father = FATHER_NAMES[index % FATHER_NAMES.length];
    const family = FAMILY_NAMES[(index * 3) % FAMILY_NAMES.length];
    return { father, family };
  };

  // Helper to pop a slot from a grade
  const popSlot = (grade: number): StudentSlot | undefined => {
    return slotsByGrade[grade]?.shift();
  };

  // 4.1 Plan 3-sibling families (e.g. Grade 1 + Grade 4 + Grade 7, Grade 2 + Grade 5 + Grade 8, Grade 3 + Grade 6 + Grade 8, etc.)
  const tripletsConfigs = [
    [1, 4, 7], [2, 5, 8], [3, 6, 8], [1, 3, 6], [2, 4, 7],
    [3, 5, 8], [1, 5, 7], [2, 6, 8], [4, 6, 8], [1, 4, 8]
  ];

  for (const config of tripletsConfigs) {
    const slot1 = popSlot(config[0]);
    const slot2 = popSlot(config[1]);
    const slot3 = popSlot(config[2]);

    if (slot1 && slot2 && slot3) {
      const { father, family } = getFamilyNames(guardianCounter);
      families.push({
        fatherName: father,
        familyName: family,
        guardianPhone: `091${String(1000000 + guardianCounter).padStart(7, '0')}`,
        guardianCode: `GRD-${String(guardianCounter).padStart(5, '0')}`,
        children: [
          { slot: slot1, firstName: FIRST_NAMES[(guardianCounter * 5 + 1) % FIRST_NAMES.length] },
          { slot: slot2, firstName: FIRST_NAMES[(guardianCounter * 5 + 2) % FIRST_NAMES.length] },
          { slot: slot3, firstName: FIRST_NAMES[(guardianCounter * 5 + 3) % FIRST_NAMES.length] },
        ],
      });
      guardianCounter++;
    }
  }

  // 4.2 Plan 2-sibling families across various grade pairs (e.g. [4, 8], [1, 5], [2, 6], [3, 7], [4, 7], [2, 4], [3, 5], etc.)
  const pairConfigs = [
    [4, 8], [4, 8], [4, 8], [1, 5], [1, 5], [2, 6], [2, 6], [3, 7], [3, 7],
    [1, 4], [1, 4], [2, 5], [2, 5], [3, 6], [3, 6], [5, 8], [5, 8], [6, 8], [6, 8],
    [1, 3], [1, 3], [2, 4], [2, 4], [3, 5], [3, 5], [5, 7], [5, 7], [6, 7], [6, 7],
    [1, 8], [2, 7], [3, 8], [4, 6], [5, 8], [1, 6], [2, 8], [3, 7], [4, 7], [1, 7],
    [2, 3], [4, 5], [6, 7], [7, 8], [7, 8], [5, 6], [3, 4], [1, 2], [2, 3], [4, 5]
  ];

  for (const config of pairConfigs) {
    const slot1 = popSlot(config[0]);
    const slot2 = popSlot(config[1]);

    if (slot1 && slot2) {
      const { father, family } = getFamilyNames(guardianCounter);
      families.push({
        fatherName: father,
        familyName: family,
        guardianPhone: `091${String(1000000 + guardianCounter).padStart(7, '0')}`,
        guardianCode: `GRD-${String(guardianCounter).padStart(5, '0')}`,
        children: [
          { slot: slot1, firstName: FIRST_NAMES[(guardianCounter * 7 + 1) % FIRST_NAMES.length] },
          { slot: slot2, firstName: FIRST_NAMES[(guardianCounter * 7 + 2) % FIRST_NAMES.length] },
        ],
      });
      guardianCounter++;
    }
  }

  // 4.3 Plan remaining slots as 1-child families
  for (let g = 1; g <= 8; g++) {
    const remainingSlots = slotsByGrade[g] || [];
    for (const slot of remainingSlots) {
      const { father, family } = getFamilyNames(guardianCounter);
      families.push({
        fatherName: father,
        familyName: family,
        guardianPhone: `091${String(1000000 + guardianCounter).padStart(7, '0')}`,
        guardianCode: `GRD-${String(guardianCounter).padStart(5, '0')}`,
        children: [
          { slot, firstName: FIRST_NAMES[(guardianCounter * 11 + 1) % FIRST_NAMES.length] },
        ],
      });
      guardianCounter++;
    }
  }

  // 5. Persist All Families, Guardians, Students & Enrollments
  console.log(`Planned ${families.length} Families for 371 Students.`);
  console.log(`- 3-Sibling Families: ${families.filter(f => f.children.length === 3).length}`);
  console.log(`- 2-Sibling Families: ${families.filter(f => f.children.length === 2).length}`);
  console.log(`- 1-Child Families: ${families.filter(f => f.children.length === 1).length}\n`);

  let globalStudentCounter = 1;
  let multiSiblingExamples: string[] = [];

  for (const fam of families) {
    // 5.1 Create Guardian User & Profile
    const guardianFullName = `${fam.fatherName} ${fam.familyName}`;

    const guardianUser = await prisma.user.create({
      data: {
        user_code: fam.guardianCode,
        password: defaultPasswordHash,
        role_type: RoleType.parent,
        is_active: 1,
      },
    });

    const guardian = await prisma.guardian.create({
      data: {
        user_id: guardianUser.id,
        full_name: guardianFullName,
        phone: fam.guardianPhone,
        relationship: GuardianRelationship.father,
      },
    });

    const siblingDescList: string[] = [];

    // 5.2 Create Each Child in the Family
    for (let cIdx = 0; cIdx < fam.children.length; cIdx++) {
      const child = fam.children[cIdx];
      const slot = child.slot;
      const studentCode = `STD-${String(globalStudentCounter).padStart(5, '0')}`;
      const studentFullName = `${child.firstName} ${fam.fatherName} ${fam.familyName}`;
      const seatingNumber = `${slot.grade}${slot.sectionIndex}${String(slot.studentIndexInSection).padStart(2, '0')}`;

      const birthYear = GRADE_BIRTH_YEARS[slot.grade] || (2021 - slot.grade);
      const birthMonth = ((globalStudentCounter * 3) % 12) + 1;
      const birthDay = ((globalStudentCounter * 7) % 28) + 1;
      const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
      const studentPhone = `092${String(2000000 + globalStudentCounter).padStart(7, '0')}`;

      // Student User
      const studentUser = await prisma.user.create({
        data: {
          user_code: studentCode,
          password: defaultPasswordHash,
          role_type: RoleType.student,
          is_active: 1,
        },
      });

      // Student Profile
      const student = await prisma.student.create({
        data: {
          user_id: studentUser.id,
          full_name: studentFullName,
          birth_date: birthDate,
          gender: Gender.male,
          phone: studentPhone,
        },
      });

      // Link to Shared Family Guardian
      await prisma.guardianStudent.create({
        data: {
          guardian_id: guardian.id,
          student_id: student.id,
          is_primary: 1,
        },
      });

      // Enroll in Class Section
      await prisma.studentEnrollment.create({
        data: {
          academic_year_id: activeYear.id,
          student_id: student.id,
          class_id: slot.classId,
          grade_level: slot.grade,
          class_section_id: slot.classSectionId,
          seating_number: seatingNumber,
          status: EnrollmentStatus.enrolled,
        },
      });

      siblingDescList.push(`${studentFullName} (الصف ${slot.grade} - ${slot.sectionName})`);
      globalStudentCounter++;
    }

    if (fam.children.length > 1 && multiSiblingExamples.length < 10) {
      multiSiblingExamples.push(`👨‍👦 ولي الأمر: ${guardianFullName} [${fam.guardianCode}] -> الأبناء (${fam.children.length}):\n      * ${siblingDescList.join('\n      * ')}`);
    }
  }

  console.log('=============================================================');
  console.log(`🎉 COMPLETED SEEDING WITH REALISTIC SIBLING RELATIONSHIPS`);
  console.log(`- Total Students: ${globalStudentCounter - 1}`);
  console.log(`- Total Unique Guardians (Fathers): ${families.length}`);
  console.log('=============================================================\n');

  console.log('📋 أمثلة على الإخوة وأولياء الأمور المشتركين في النظام:');
  for (const ex of multiSiblingExamples) {
    console.log(ex);
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
