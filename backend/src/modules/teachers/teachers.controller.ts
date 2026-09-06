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
import { TeachersService } from './teachers.service.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { FindTeachersQueryDto } from './dto/find-teachers-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(RoleType.admin)
  async findAll(@Query() query: FindTeachersQueryDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleType.admin, RoleType.teacher)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.teachersService.findOne(id, user);
  }

  @Post()
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTeacherDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.teachersService.create(dto, Number(user.id), ipAddress, userAgent);
  }

  @Put(':id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.teachersService.update(id, dto, Number(user.id), ipAddress, userAgent);
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
    return this.teachersService.delete(id, Number(user.id), ipAddress, userAgent);
  }
}
