import { Module, forwardRef } from '@nestjs/common';
import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { StudentEnrollmentsModule } from '../student-enrollments/student-enrollments.module.js';

@Module({
  imports: [AuditModule, AuthModule, forwardRef(() => StudentEnrollmentsModule)],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
