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
import { SectionsService } from './sections.service.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';
import { QuerySectionsDto } from './dto/query-sections.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/academic/sections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  async findAll(@Query() query: QuerySectionsDto) {
    return this.sectionsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSectionDto, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.sectionsService.create(dto, adminId, ipAddress, userAgent);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.sectionsService.update(id, dto, adminId, ipAddress, userAgent);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.sectionsService.remove(id, adminId, ipAddress, userAgent);
  }
}
