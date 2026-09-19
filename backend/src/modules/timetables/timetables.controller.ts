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
  ForbiddenException,
  UsePipes,
  ValidationPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TimetablesService } from './timetables.service.js';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto.js';
import { UpdateTimetableSlotDto } from './dto/update-timetable-slot.dto.js';
import { QueryTimetableDto } from './dto/query-timetable.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (validationErrors = []) => {
      const errors: Record<string, string[]> = {};
      for (const err of validationErrors) {
        if (err.constraints) {
          errors[err.property] = Object.values(err.constraints);
        }
      }
      return new UnprocessableEntityException({
        success: false,
        message: 'بيانات تسكين الحصة غير صالحة.',
        errors,
      });
    },
  }),
)
export class TimetablesController {
  constructor(private readonly timetablesService: TimetablesService) {}

  /**
   * 1.1 GET /api/v1/timetable-slots
   * Retrieve lightweight classes & sections structure (Admin, Teacher)
   */
  @Get('api/v1/timetable-slots')
  @Roles(RoleType.admin, RoleType.teacher)
  async findStructure(@Query() query: QueryTimetableDto) {
    return this.timetablesService.findStructure(query);
  }

  /**
   * 1.2 GET /api/v1/timetable-slots/completion-status
   * Audit timetable completion and unscheduled slots (Admin only)
   */
  @Get('api/v1/timetable-slots/completion-status')
  @Roles(RoleType.admin)
  async getCompletionStatus(
    @Query() query: QueryTimetableDto,
    @CurrentUser() user: any,
  ) {
    if (user?.role_type && user.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    return this.timetablesService.getCompletionStatus(query);
  }

  /**
   * 1.3 GET /api/v1/class-sections/:class_section_id/timetable
   * Lazy load weekly timetable matrix for a single class section (Admin, Teacher, Student, Parent)
   */
  @Get('api/v1/class-sections/:class_section_id/timetable')
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async getSectionTimetable(
    @Param('class_section_id', ParseIntPipe) classSectionId: number,
  ) {
    return this.timetablesService.getSectionTimetable(classSectionId);
  }

  /**
   * 1.4 GET /api/v1/teachers/:teacher_id/timetable
   * Retrieve weekly timetable for a specific teacher (Admin, Teacher)
   */
  @Get('api/v1/teachers/:teacher_id/timetable')
  @Roles(RoleType.admin, RoleType.teacher)
  async getTeacherTimetable(
    @Param('teacher_id', ParseIntPipe) teacherId: number,
  ) {
    return this.timetablesService.getTeacherTimetable(teacherId);
  }

  /**
   * 1.5 POST /api/v1/timetable-slots
   * Create a new timetable slot with anti-collision checks (Admin only)
   */
  @Post('api/v1/timetable-slots')
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTimetableSlotDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    if (user?.role_type && user.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers ? (req.headers['user-agent'] as string) : undefined;
    return this.timetablesService.create(
      dto,
      Number(user?.id || 1),
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.5 PUT /api/v1/timetable-slots/:id
   * Update an existing timetable slot (Admin only)
   */
  @Put('api/v1/timetable-slots/:id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimetableSlotDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    if (user?.role_type && user.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers ? (req.headers['user-agent'] as string) : undefined;
    return this.timetablesService.update(
      id,
      dto,
      Number(user?.id || 1),
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.6 DELETE /api/v1/timetable-slots/:id
   * Soft delete timetable slot (Admin only)
   */
  @Delete('api/v1/timetable-slots/:id')
  @Roles(RoleType.admin)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    if (user?.role_type && user.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers ? (req.headers['user-agent'] as string) : undefined;
    return this.timetablesService.remove(
      id,
      Number(user?.id || 1),
      ipAddress,
      userAgent,
    );
  }
}
