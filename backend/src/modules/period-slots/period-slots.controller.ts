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
} from '@nestjs/common';
import { PeriodSlotsService } from './period-slots.service.js';
import { CreatePeriodSlotDto } from './dto/create-period-slot.dto.js';
import { UpdatePeriodSlotDto } from './dto/update-period-slot.dto.js';
import { QueryPeriodSlotDto } from './dto/query-period-slot.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/period-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodSlotsController {
  constructor(private readonly periodSlotsService: PeriodSlotsService) {}

  /**
   * 1.1 GET /api/v1/period-slots
   * Retrieve and search daily period slots (Admin, Teacher, Student, Parent)
   */
  @Get()
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async findAll(@Query() query: QueryPeriodSlotDto) {
    return this.periodSlotsService.findAll(query);
  }

  /**
   * 1.2 POST /api/v1/period-slots
   * Add a new daily period slot or break period (Admin only)
   */
  @Post()
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePeriodSlotDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    if (user?.role_type && user.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers ? (req.headers['user-agent'] as string) : undefined;
    return this.periodSlotsService.create(dto, Number(user?.id || 1), ipAddress, userAgent);
  }

  /**
   * 1.2 PUT /api/v1/period-slots/:id
   * Update an existing period slot (Admin only)
   */
  @Put(':id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePeriodSlotDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    if (user?.role_type && user.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers ? (req.headers['user-agent'] as string) : undefined;
    return this.periodSlotsService.update(id, dto, Number(user?.id || 1), ipAddress, userAgent);
  }

  /**
   * 1.3 DELETE /api/v1/period-slots/:id
   * Delete period slot with RESTRICT check (Admin only)
   */
  @Delete(':id')
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
    return this.periodSlotsService.remove(id, Number(user?.id || 1), ipAddress, userAgent);
  }
}
