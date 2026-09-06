import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ClassSectionsService } from './class-sections.service.js';
import { CreateClassSectionDto } from './dto/create-class-section.dto.js';
import { QueryClassSectionsDto } from './dto/query-class-sections.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/academic/class-sections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class ClassSectionsController {
  constructor(private readonly sectionsService: ClassSectionsService) {}

  @Get()
  async findAll(@Query() query: QueryClassSectionsDto) {
    return this.sectionsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateClassSectionDto, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.sectionsService.create(dto, adminId, ipAddress, userAgent);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.sectionsService.remove(id, adminId, ipAddress, userAgent);
  }
}
