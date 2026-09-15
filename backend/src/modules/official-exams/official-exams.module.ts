import { Module } from '@nestjs/common';
import { OfficialExamsController } from './official-exams.controller.js';
import { OfficialExamsService } from './official-exams.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [OfficialExamsController],
  providers: [OfficialExamsService],
  exports: [OfficialExamsService],
})
export class OfficialExamsModule {}
