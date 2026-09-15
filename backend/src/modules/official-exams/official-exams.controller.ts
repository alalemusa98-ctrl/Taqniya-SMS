import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OfficialExamsService } from './official-exams.service.js';
import { CreateOfficialExamDto } from './dto/create-official-exam.dto.js';
import { UpdateOfficialExamDto } from './dto/update-official-exam.dto.js';
import { QueryOfficialExamsDto } from './dto/query-official-exams.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OfficialExamsController {
  constructor(private readonly examsService: OfficialExamsService) {}

  /**
   * 1.1 GET /api/v1/official-exams
   * List and filter school-wide official exams schedule (Admin only)
   */
  @Get('official-exams')
  @Roles(RoleType.admin)
  async findAll(@Query() query: QueryOfficialExamsDto) {
    return this.examsService.findAll(query);
  }

  /**
   * 1.2 GET /api/v1/official-exams/:id
   * Get specific official exam details, instructions, room, and attachments
   */
  @Get('official-exams/:id')
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.examsService.findById(id);
  }

  /**
   * 1.3 GET /api/v1/classes/:class_id/official-exams
   * View class official exam timetable grouped by exam type (Student, Parent, Admin)
   */
  @Get('classes/:class_id/official-exams')
  @Roles(RoleType.student, RoleType.parent, RoleType.admin)
  async findByClass(
    @Param('class_id', ParseIntPipe) classId: number,
    @Query('academic_term_id') termId?: string,
  ) {
    return this.examsService.findByClass(
      classId,
      termId ? Number(termId) : undefined,
    );
  }

  /**
   * 1.4 GET /api/v1/teachers/:teacher_id/official-exams
   * View teacher's assigned subjects exam schedule (Teacher, Admin)
   */
  @Get('teachers/:teacher_id/official-exams')
  @Roles(RoleType.teacher, RoleType.admin)
  async findByTeacher(
    @Param('teacher_id', ParseIntPipe) teacherId: number,
    @Query('academic_term_id') termId?: string,
    @CurrentUser() currentUser?: any,
  ) {
    return this.examsService.findByTeacher(
      teacherId,
      termId ? Number(termId) : undefined,
      currentUser,
    );
  }

  /**
   * 1.5 POST /api/v1/official-exams
   * Schedule new official exam with attachments (Admin only)
   */
  @Post('official-exams')
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateOfficialExamDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.examsService.create(
      dto,
      Number(currentUser.id),
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.6 PUT /api/v1/official-exams/:id
   * Update official exam schedule and attachments (Admin only)
   */
  @Put('official-exams/:id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOfficialExamDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.examsService.update(
      id,
      dto,
      Number(currentUser.id),
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.7 DELETE /api/v1/official-exams/:id
   * Soft delete official exam from approved schedule (Admin only)
   */
  @Delete('official-exams/:id')
  @Roles(RoleType.admin)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.examsService.delete(
      id,
      Number(currentUser.id),
      ipAddress,
      userAgent,
    );
  }
}
