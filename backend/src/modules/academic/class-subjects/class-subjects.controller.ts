import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ClassSubjectsService } from './class-subjects.service.js';
import { CreateClassSubjectDto } from './dto/create-class-subject.dto.js';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto.js';
import { QueryClassSubjectsDto } from './dto/query-class-subjects.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/academic/class-subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class ClassSubjectsController {
  constructor(private readonly subjectsService: ClassSubjectsService) {}

  @Get()
  async findAll(@Query() query: QueryClassSubjectsDto) {
    return this.subjectsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateClassSubjectDto, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.subjectsService.create(dto, adminId, ipAddress, userAgent);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassSubjectDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.subjectsService.update(id, dto, adminId, ipAddress, userAgent);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.subjectsService.remove(id, adminId, ipAddress, userAgent);
  }
}
