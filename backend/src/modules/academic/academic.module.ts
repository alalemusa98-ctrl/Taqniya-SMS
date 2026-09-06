import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { YearsController } from './years/years.controller.js';
import { YearsService } from './years/years.service.js';
import { TermsController } from './terms/terms.controller.js';
import { TermsService } from './terms/terms.service.js';
import { StagesController } from './stages/stages.controller.js';
import { StagesService } from './stages/stages.service.js';
import { ClassesController } from './classes/classes.controller.js';
import { ClassesService } from './classes/classes.service.js';
import { SectionsController } from './sections/sections.controller.js';
import { SectionsService } from './sections/sections.service.js';
import { SubjectsController } from './subjects/subjects.controller.js';
import { SubjectsService } from './subjects/subjects.service.js';

@Module({
  imports: [AuthModule],
  controllers: [
    YearsController,
    TermsController,
    StagesController,
    ClassesController,
    SectionsController,
    SubjectsController,
  ],
  providers: [
    YearsService,
    TermsService,
    StagesService,
    ClassesService,
    SectionsService,
    SubjectsService,
  ],
  exports: [
    YearsService,
    TermsService,
    StagesService,
    ClassesService,
    SectionsService,
    SubjectsService,
  ],
})
export class AcademicModule {}
