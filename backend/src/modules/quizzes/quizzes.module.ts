import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller.js';
import { QuizzesService } from './quizzes.service.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
