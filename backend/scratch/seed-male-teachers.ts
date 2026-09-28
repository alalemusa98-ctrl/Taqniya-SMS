import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Creating Male Teachers for Boys School (Taqniya-SMS) ===');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const teachersList = [
    // 1. قسم اللغة العربية والتربية الإسلامية والكتابة (8 مدرسين)
    {
      code: 'TCH-101',
      name: 'أ. أحمد عبد الله المحمودي',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000101',
    },
    {
      code: 'TCH-102',
      name: 'أ. محمد علي الزوي',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000102',
    },
    {
      code: 'TCH-103',
      name: 'أ. عمر حسن الفرجاني',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000103',
    },
    {
      code: 'TCH-104',
      name: 'أ. طارق سالم الشريف',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000104',
    },
    {
      code: 'TCH-105',
      name: 'أ. خالد إبراهيم القماطي',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000105',
    },
    {
      code: 'TCH-106',
      name: 'أ. يوسف مصطفى الغرياني',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000106',
    },
    {
      code: 'TCH-107',
      name: 'أ. عبد الرحمن صالح الترهوني',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000107',
    },
    {
      code: 'TCH-108',
      name: 'أ. محمود سليمان الورفلي',
      specialization: 'اللغة العربية والتربية الإسلامية',
      phone: '0911000108',
    },

    // 2. قسم الرياضيات (5 مدرسين)
    {
      code: 'TCH-201',
      name: 'أ. علي سالم المقرحي',
      specialization: 'الرياضيات',
      phone: '0912000201',
    },
    {
      code: 'TCH-202',
      name: 'أ. سالم مفتاح الصادق',
      specialization: 'الرياضيات',
      phone: '0912000202',
    },
    {
      code: 'TCH-203',
      name: 'أ. حسام الدين عبد السلام',
      specialization: 'الرياضيات',
      phone: '0912000203',
    },
    {
      code: 'TCH-204',
      name: 'أ. وليد فرج المنصوري',
      specialization: 'الرياضيات',
      phone: '0912000204',
    },
    {
      code: 'TCH-205',
      name: 'أ. حمزة عثمان الككلي',
      specialization: 'الرياضيات',
      phone: '0912000205',
    },

    // 3. قسم اللغة الإنجليزية (3 مدرسين)
    {
      code: 'TCH-301',
      name: 'أ. مصطفى خالد الدوكالي',
      specialization: 'اللغة الإنجليزية',
      phone: '0913000301',
    },
    {
      code: 'TCH-302',
      name: 'أ. أنيس عبد الكريم الشعلالي',
      specialization: 'اللغة الإنجليزية',
      phone: '0913000302',
    },
    {
      code: 'TCH-303',
      name: 'أ. هيثم يونس بوشناف',
      specialization: 'اللغة الإنجليزية',
      phone: '0913000303',
    },

    // 4. قسم العلوم (3 مدرسين)
    {
      code: 'TCH-401',
      name: 'أ. أسامة جمعة العريبي',
      specialization: 'العلوم العامة',
      phone: '0914000401',
    },
    {
      code: 'TCH-402',
      name: 'أ. بدر الدين رمضان الكاتب',
      specialization: 'العلوم العامة',
      phone: '0914000402',
    },
    {
      code: 'TCH-403',
      name: 'أ. زياد مسعود السنوسي',
      specialization: 'العلوم العامة',
      phone: '0914000403',
    },

    // 5. قسم المواد الاجتماعية (التاريخ / الجغرافيا / الاجتماعيات) (2 مدرسين)
    {
      code: 'TCH-501',
      name: 'أ. عبد الله فرج الرقيعي',
      specialization: 'الدراسات الاجتماعية والتاريخ والجغرافيا',
      phone: '0915000501',
    },
    {
      code: 'TCH-502',
      name: 'أ. ناصر سعد الدرسي',
      specialization: 'الدراسات الاجتماعية والتاريخ والجغرافيا',
      phone: '0915000502',
    },

    // 6. قسم الحاسوب وتقنية المعلومات (1 مدرس)
    {
      code: 'TCH-601',
      name: 'أ. مروان فتحي التواتي',
      specialization: 'الحاسوب وتكنولوجيا المعلومات',
      phone: '0916000601',
    },
  ];

  for (const t of teachersList) {
    let user = await prisma.user.findFirst({
      where: { user_code: t.code },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          user_code: t.code,
          password: defaultPasswordHash,
          role_type: RoleType.teacher,
          is_active: 1,
        },
      });
      console.log(`+ Created User: ${t.code}`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          deleted_at: null,
          is_active: 1,
        },
      });
    }

    let teacher = await prisma.teacher.findFirst({
      where: { user_id: user.id },
    });

    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          user_id: user.id,
          full_name: t.name,
          specialization: t.specialization,
          phone: t.phone,
          hire_date: new Date('2025-09-01'),
        },
      });
      console.log(`+ Created Teacher Profile: ${t.name} (التخصص: ${t.specialization}, ID: ${teacher.id})`);
    } else {
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          full_name: t.name,
          specialization: t.specialization,
          phone: t.phone,
          deleted_at: null,
        },
      });
      console.log(`✓ Updated Teacher Profile: ${t.name} (ID: ${teacher.id})`);
    }
  }

  console.log(`\n=== Successfully Created ${teachersList.length} Male Teachers ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
