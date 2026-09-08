import { Module } from '@nestjs/common';
import { GuardiansController } from './guardians.controller.js';
import { GuardiansService } from './guardians.service.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [GuardiansController],
  providers: [GuardiansService],
  exports: [GuardiansService],
})
export class GuardiansModule {}
