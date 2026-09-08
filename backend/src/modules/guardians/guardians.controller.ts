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
import { GuardiansService } from './guardians.service.js';
import { CreateGuardianDto } from './dto/create-guardian.dto.js';
import { UpdateGuardianDto } from './dto/update-guardian.dto.js';
import { FindGuardiansQueryDto } from './dto/find-guardians-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/guardians')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  @Roles(RoleType.admin)
  async findAll(@Query() query: FindGuardiansQueryDto) {
    return this.guardiansService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleType.admin, RoleType.parent)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.guardiansService.findOne(id, user);
  }

  @Post()
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateGuardianDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.guardiansService.create(dto, Number(user.id), ipAddress, userAgent);
  }

  @Put(':id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGuardianDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.guardiansService.update(id, dto, Number(user.id), ipAddress, userAgent);
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
    return this.guardiansService.delete(id, Number(user.id), ipAddress, userAgent);
  }

  @Get(':guardian_id/students')
  @Roles(RoleType.admin, RoleType.parent)
  async getStudents(
    @Param('guardian_id', ParseIntPipe) guardianId: number,
    @CurrentUser() user: any,
  ) {
    return this.guardiansService.getStudents(guardianId, user);
  }
}
