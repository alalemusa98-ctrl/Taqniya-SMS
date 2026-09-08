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
import { StudentsService } from './students.service.js';
import { StudentEnrollmentsService } from '../student-enrollments/student-enrollments.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { FindStudentsQueryDto } from './dto/find-students-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly studentEnrollmentsService: StudentEnrollmentsService,
  ) {}

  @Get()
  @Roles(RoleType.admin, RoleType.teacher)
  async findAll(@Query() query: FindStudentsQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.studentsService.findOne(id, user);
  }

  @Post()
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.studentsService.create(dto, Number(user.id), ipAddress, userAgent);
  }

  @Put(':id')
  @Roles(RoleType.admin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.studentsService.update(id, dto, Number(user.id), ipAddress, userAgent);
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
    return this.studentsService.delete(id, Number(user.id), ipAddress, userAgent);
  }

  @Get(':student_id/enrollments')
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async getEnrollments(
    @Param('student_id', ParseIntPipe) studentId: number,
    @CurrentUser() user: any,
  ) {
    return this.studentEnrollmentsService.getStudentEnrollments(studentId, user);
  }
}
