import { Module } from '@nestjs/common';
import { GuardianStudentsController } from './guardian-students.controller.js';
import { GuardianStudentsService } from './guardian-students.service.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [GuardianStudentsController],
  providers: [GuardianStudentsService],
  exports: [GuardianStudentsService],
})
export class GuardianStudentsModule {}
