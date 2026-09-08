import { Module, forwardRef } from '@nestjs/common';
import { StudentEnrollmentsController } from './student-enrollments.controller.js';
import { StudentEnrollmentsService } from './student-enrollments.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { StudentsModule } from '../students/students.module.js';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    forwardRef(() => StudentsModule),
  ],
  controllers: [StudentEnrollmentsController],
  providers: [StudentEnrollmentsService],
  exports: [StudentEnrollmentsService],
})
export class StudentEnrollmentsModule {}
