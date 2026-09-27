import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AcademicModule } from './modules/academic/academic.module.js';
import { TeachersModule } from './modules/teachers/teachers.module.js';
import { TeachingAssignmentsModule } from './modules/teaching-assignments/teaching-assignments.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { GuardiansModule } from './modules/guardians/guardians.module.js';
import { GuardianStudentsModule } from './modules/guardian-students/guardian-students.module.js';
import { StudentEnrollmentsModule } from './modules/student-enrollments/student-enrollments.module.js';
import { PeriodSlotsModule } from './modules/period-slots/period-slots.module.js';
import { TimetablesModule } from './modules/timetables/timetables.module.js';
import { AssignmentsModule } from './modules/assignments/assignments.module.js';
import { QuizzesModule } from './modules/quizzes/quizzes.module.js';
import { OfficialExamsModule } from './modules/official-exams/official-exams.module.js';
import { PromotionModule } from './modules/promotion/promotion.module.js';
import { BackupModule } from './modules/backup/backup.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    AcademicModule,
    TeachersModule,
    TeachingAssignmentsModule,
    StudentsModule,
    GuardiansModule,
    GuardianStudentsModule,
    StudentEnrollmentsModule,
    PeriodSlotsModule,
    TimetablesModule,
    AssignmentsModule,
    QuizzesModule,
    OfficialExamsModule,
    PromotionModule,
    BackupModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
