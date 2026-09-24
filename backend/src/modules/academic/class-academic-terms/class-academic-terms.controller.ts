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
import { ClassAcademicTermsService } from './class-academic-terms.service.js';
import { CreateClassAcademicTermDto } from './dto/create-class-academic-term.dto.js';
import { UpdateClassAcademicTermDto } from './dto/update-class-academic-term.dto.js';
import { QueryClassAcademicTermsDto } from './dto/query-class-academic-terms.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/academic/class-academic-terms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class ClassAcademicTermsController {
  constructor(private readonly termsService: ClassAcademicTermsService) {}

  @Get()
  async findAll(@Query() query: QueryClassAcademicTermsDto) {
    return this.termsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.termsService.findOne(id);
  }

  @Get(':id/activation-check')
  async checkActivation(@Param('id', ParseIntPipe) id: number) {
    return this.termsService.checkActivation(id);
  }

  @Post()
  async create(@Body() dto: CreateClassAcademicTermDto, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.termsService.create(dto, adminId, ipAddress, userAgent);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassAcademicTermDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.termsService.update(id, dto, adminId, ipAddress, userAgent);
  }

  @Post(':id/activate')
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @Query('force') queryForce?: string,
    @Body('force') bodyForce?: boolean,
    @Req() req?: Request,
  ) {
    const adminId = (req as any)?.user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers ? req.headers['user-agent'] : undefined;
    const force = queryForce === 'true' || queryForce === '1' || bodyForce === true;
    return this.termsService.activate(id, adminId, ipAddress, userAgent, force);
  }

  @Post(':id/close')
  async close(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.termsService.close(id, adminId, ipAddress, userAgent);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const adminId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.termsService.remove(id, adminId, ipAddress, userAgent);
  }
}
