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
import { SubjectsService } from './subjects.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';
import { QuerySubjectsDto } from './dto/query-subjects.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/academic/subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  async findAll(@Query() query: QuerySubjectsDto) {
    return this.subjectsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSubjectDto, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.subjectsService.create(dto, adminId, ipAddress, userAgent);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
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
