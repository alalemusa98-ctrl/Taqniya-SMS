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
import { StudentEnrollmentsService } from './student-enrollments.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto.js';
import { BulkEnrollDto } from './dto/bulk-enroll.dto.js';
import { FindEnrollmentsQueryDto } from './dto/find-enrollments-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/student-enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentEnrollmentsController {
  constructor(
    private readonly enrollmentsService: StudentEnrollmentsService,
  ) {}

  @Get()
  @Roles(RoleType.admin, RoleType.teacher)
  async findAll(
    @Query() query: FindEnrollmentsQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.enrollmentsService.findAll(query, user);
  }

  @Post()
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.enrollmentsService.create(
      dto,
      Number(user.id),
      ipAddress,
      userAgent,
    );
  }

  @Post('bulk-enroll')
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.OK)
  async bulkEnroll(
    @Body() dto: BulkEnrollDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.enrollmentsService.bulkEnroll(
      dto,
      Number(user.id),
      ipAddress,
      userAgent,
    );
  }

  @Put(':id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.enrollmentsService.update(
      id,
      dto,
      Number(user.id),
      ipAddress,
      userAgent,
    );
  }

  @Delete(':id')
  @Roles(RoleType.admin)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.enrollmentsService.delete(
      id,
      Number(user.id),
      ipAddress,
      userAgent,
    );
  }
}
