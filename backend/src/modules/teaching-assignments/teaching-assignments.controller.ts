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
import { TeachingAssignmentsService } from './teaching-assignments.service.js';
import { CreateTeachingAssignmentDto } from './dto/create-teaching-assignment.dto.js';
import { UpdateTeachingAssignmentDto } from './dto/update-teaching-assignment.dto.js';
import { FindTeachingAssignmentsQueryDto } from './dto/find-teaching-assignments-query.dto.js';
import { FindTeacherAssignmentsQueryDto } from './dto/find-teacher-assignments-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachingAssignmentsController {
  constructor(private readonly assignmentsService: TeachingAssignmentsService) {}

  /**
   * 1.1 GET /api/v1/teaching-assignments
   * Browse hierarchical grouped assignment map
   */
  @Get('teaching-assignments')
  @Roles(RoleType.admin)
  async findAll(@Query() query: FindTeachingAssignmentsQueryDto) {
    return this.assignmentsService.findAll(query);
  }

  /**
   * 1.2 GET /api/v1/teachers/:teacher_id/assignments
   * View workload for specific teacher (Admin or own teacher)
   */
  @Get('teachers/:teacher_id/assignments')
  @Roles(RoleType.admin, RoleType.teacher)
  async findTeacherAssignments(
    @Param('teacher_id', ParseIntPipe) teacherId: number,
    @Query() query: FindTeacherAssignmentsQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.assignmentsService.findTeacherAssignments(teacherId, query, user);
  }

  /**
   * 1.3 POST /api/v1/teaching-assignments
   * Assign teacher to subject in class section
   */
  @Post('teaching-assignments')
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTeachingAssignmentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.assignmentsService.create(dto, Number(user.id), ipAddress, userAgent);
  }

  /**
   * 1.3 PUT /api/v1/teaching-assignments/:id
   * Reassign / Update assignment
   */
  @Put('teaching-assignments/:id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeachingAssignmentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.assignmentsService.update(id, dto, Number(user.id), ipAddress, userAgent);
  }

  /**
   * 1.4 DELETE /api/v1/teaching-assignments/:id
   * Soft delete with RESTRICT check
   */
  @Delete('teaching-assignments/:id')
  @Roles(RoleType.admin)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.assignmentsService.delete(id, Number(user.id), ipAddress, userAgent);
  }
}
