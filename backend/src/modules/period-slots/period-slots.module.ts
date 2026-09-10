import { Module } from '@nestjs/common';
import { PeriodSlotsController } from './period-slots.controller.js';
import { PeriodSlotsService } from './period-slots.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [PeriodSlotsController],
  providers: [PeriodSlotsService],
  exports: [PeriodSlotsService],
})
export class PeriodSlotsModule {}
