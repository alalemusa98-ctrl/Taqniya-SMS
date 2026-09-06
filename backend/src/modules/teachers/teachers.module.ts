import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller.js';
import { TeachersService } from './teachers.service.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
