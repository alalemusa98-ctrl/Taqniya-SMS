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
import { QuizzesService } from './quizzes.service.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';
import { QueryQuizzesDto } from './dto/query-quizzes.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  /**
   * 1.1 GET /api/v1/quizzes
   * Browse and filter quizzes list with pagination and hierarchical grouping (Admin, Teacher, Student, Parent)
   */
  @Get()
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async findAll(
    @Query() query: QueryQuizzesDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.quizzesService.findAll(query, currentUser);
  }

  /**
   * 1.2 GET /api/v1/quizzes/:id
   * Get full details, topics, and attachments of a specific quiz
   */
  @Get(':id')
  @Roles(RoleType.admin, RoleType.teacher, RoleType.student, RoleType.parent)
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.quizzesService.findById(id, currentUser);
  }

  /**
   * 1.3 POST /api/v1/quizzes
   * Schedule and publish new quiz (Admin, Teacher)
   */
  @Post()
  @Roles(RoleType.admin, RoleType.teacher)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateQuizDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.quizzesService.create(
      dto,
      currentUser,
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.4 PUT /api/v1/quizzes/:id
   * Update quiz details and date (Admin, Teacher creator/assigned)
   */
  @Put(':id')
  @Roles(RoleType.admin, RoleType.teacher)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.quizzesService.update(
      id,
      dto,
      currentUser,
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.5 DELETE /api/v1/quizzes/:id
   * Soft delete quiz (Admin, Teacher creator/assigned)
   */
  @Delete(':id')
  @Roles(RoleType.admin, RoleType.teacher)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.quizzesService.delete(
      id,
      currentUser,
      ipAddress,
      userAgent,
    );
  }
}
