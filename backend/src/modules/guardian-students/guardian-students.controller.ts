import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GuardianStudentsService } from './guardian-students.service.js';
import { CreateGuardianStudentDto } from './dto/create-guardian-student.dto.js';
import { UpdateGuardianStudentDto } from './dto/update-guardian-student.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/guardian-students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardianStudentsController {
  constructor(
    private readonly guardianStudentsService: GuardianStudentsService,
  ) {}

  @Post()
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateGuardianStudentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.guardianStudentsService.create(
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
    @Body() dto: UpdateGuardianStudentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.guardianStudentsService.update(
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
    return this.guardianStudentsService.delete(
      id,
      Number(user.id),
      ipAddress,
      userAgent,
    );
  }
}
