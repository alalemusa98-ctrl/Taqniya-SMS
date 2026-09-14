import { Module } from '@nestjs/common';
import { TimetablesController } from './timetables.controller.js';
import { TimetablesService } from './timetables.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [TimetablesController],
  providers: [TimetablesService],
  exports: [TimetablesService],
})
export class TimetablesModule {}
