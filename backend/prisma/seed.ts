import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeder for Phase 01...');

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
      is_active: 0, // Disabled account for testing 403 Forbidden
    },
  ];

  for (const user of seedUsers) {
    const upserted = await prisma.user.upsert({
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

    console.log(`✅ Seeded User: [${upserted.role_type.toUpperCase()}] ${upserted.user_code} (ID: ${upserted.id.toString()}, Active: ${upserted.is_active})`);
  }

  // Create initial audit log for seeding
  const adminUser = await prisma.user.findUnique({
    where: { user_code: 'ADM-1001' },
  });

  if (adminUser) {
    await prisma.auditLog.create({
      data: {
        user_id: adminUser.id,
        action: 'system_seed',
        entity_type: 'User',
        entity_id: adminUser.id,
        new_values: { message: 'Initial users seed for Phase 01 testing' },
        ip_address: '127.0.0.1',
        user_agent: 'DatabaseSeeder/1.0',
      },
    });
    console.log('✅ Created initial audit log entry.');
  }

  console.log('✨ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
