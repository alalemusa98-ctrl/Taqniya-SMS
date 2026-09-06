import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { YearsController } from './years/years.controller.js';
import { YearsService } from './years/years.service.js';
import { TermsController } from './terms/terms.controller.js';
import { TermsService } from './terms/terms.service.js';
import { StagesController } from './stages/stages.controller.js';
import { StagesService } from './stages/stages.service.js';

@Module({
  imports: [AuthModule],
  controllers: [YearsController, TermsController, StagesController],
  providers: [YearsService, TermsService, StagesService],
  exports: [YearsService, TermsService, StagesService],
})
export class AcademicModule {}
