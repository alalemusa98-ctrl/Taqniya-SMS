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
import { AssignmentsService } from './assignments.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { UpdateAssignmentDto } from './dto/update-assignment.dto.js';
import { QueryAssignmentDto } from './dto/query-assignment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * 1.1 GET /api/v1/assignments
   * Browse and filter assignments list (Admin, Teacher, Student, Parent)
   */
  @Get()
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async findAll(
    @Query() query: QueryAssignmentDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.assignmentsService.findAll(query, currentUser);
  }

  /**
   * 1.2 GET /api/v1/assignments/:id
   * Get full details and attachments of a specific assignment
   */
  @Get(':id')
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.assignmentsService.findById(id, currentUser);
  }

  /**
   * 1.3 POST /api/v1/assignments
   * Create and publish new assignment (Admin, Teacher)
   */
  @Post()
  @Roles(RoleType.admin, RoleType.teacher)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.assignmentsService.create(
      dto,
      currentUser,
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.4 PUT /api/v1/assignments/:id
   * Update assignment details and attachments (Admin, Teacher creator/assigned)
   */
  @Put(':id')
  @Roles(RoleType.admin, RoleType.teacher)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.assignmentsService.update(
      id,
      dto,
      currentUser,
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.5 DELETE /api/v1/assignments/:id
   * Soft delete assignment (Admin, Teacher creator/assigned)
   */
  @Delete(':id')
  @Roles(RoleType.admin, RoleType.teacher)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.assignmentsService.delete(
      id,
      currentUser,
      ipAddress,
      userAgent,
    );
  }
}
