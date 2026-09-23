import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  UsePipes,
  ValidationPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PromotionService } from './promotion.service.js';
import { FreezeTranscriptDto } from './dto/freeze-transcript.dto.js';
import { QueryTranscriptsDto } from './dto/query-transcripts.dto.js';
import { PreviewPromotionDto } from './dto/preview-promotion.dto.js';
import { ExecutePromotionDto } from './dto/execute-promotion.dto.js';
import {
  SectionAuditProgressQueryDto,
  SectionRosterQueryDto,
  GenerateAnnualSectionDto,
} from './dto/section-grade-entry.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (validationErrors = []) => {
      const errors: Record<string, string[]> = {};
      for (const err of validationErrors) {
        if (err.constraints) {
          errors[err.property] = Object.values(err.constraints);
        }
      }
      return new UnprocessableEntityException({
        success: false,
        message: 'فشل التحقق من صحة البيانات المدخلة.',
        errors,
      });
    },
  }),
)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  /**
   * 3.1 GET /api/v1/transcripts/sections/audit-progress
   * Get sections grading completion status (Must be declared BEFORE transcripts/:id)
   */
  @Get('transcripts/sections/audit-progress')
  @Roles(RoleType.admin, RoleType.teacher)
  async getSectionAuditProgress(@Query() query: SectionAuditProgressQueryDto) {
    return this.promotionService.getSectionAuditProgress(query);
  }

  /**
   * 3.2 GET /api/v1/transcripts/sections/:class_section_id/roster
   * Get student roster and marks status for a section (Must be declared BEFORE transcripts/:id)
   */
  @Get('transcripts/sections/:class_section_id/roster')
  @Roles(RoleType.admin, RoleType.teacher)
  async getSectionRoster(
    @Param('class_section_id', ParseIntPipe) classSectionId: number,
    @Query() query: SectionRosterQueryDto,
  ) {
    return this.promotionService.getSectionRoster(classSectionId, query);
  }

  /**
   * 3.3 POST /api/v1/transcripts/generate-annual-for-section
   * Auto-generate annual transcripts for an entire section (Must be declared BEFORE transcripts/:id)
   */
  @Post('transcripts/generate-annual-for-section')
  @Roles(RoleType.admin)
  async generateAnnualForSection(
    @Body() dto: GenerateAnnualSectionDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.promotionService.generateAnnualForSection(
      dto,
      Number(currentUser.id),
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.4 POST /api/v1/transcripts/freeze
   * Freeze and archive official transcript (Admin only)
   */
  @Post('transcripts/freeze')
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.CREATED)
  async freezeTranscript(
    @Body() dto: FreezeTranscriptDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    if (currentUser?.role_type && currentUser.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.promotionService.freezeTranscript(
      dto,
      Number(currentUser.id),
      ipAddress,
      userAgent,
    );
  }

  /**
   * 1.1 GET /api/v1/transcripts
   * Browse and filter archived transcripts (Admin only)
   */
  @Get('transcripts')
  @Roles(RoleType.admin)
  async getTranscripts(@Query() query: QueryTranscriptsDto) {
    return this.promotionService.getTranscripts(query);
  }

  /**
   * 1.2 GET /api/v1/transcripts/:id
   * Get specific transcript details & JSON snapshot (Admin, Student, Parent)
   */
  @Get('transcripts/:id')
  @Roles(RoleType.admin, RoleType.student, RoleType.parent)
  async getTranscriptById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.promotionService.getTranscriptById(id, currentUser);
  }

  /**
   * 1.3 GET /api/v1/students/:student_id/transcripts
   * View all historical transcripts of a specific student (Admin, Student own, Parent child)
   */
  @Get('students/:student_id/transcripts')
  @Roles(RoleType.admin, RoleType.student, RoleType.parent)
  async getStudentTranscripts(
    @Param('student_id', ParseIntPipe) studentId: number,
    @Query() query: any,
    @CurrentUser() currentUser: any,
  ) {
    return this.promotionService.getStudentTranscripts(
      studentId,
      query,
      currentUser,
    );
  }

  /**
   * 2.1 GET /api/v1/promotions/batches
   * Browse promotion batches history (Admin only)
   */
  @Get('promotions/batches')
  @Roles(RoleType.admin)
  async getPromotionBatches(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    return this.promotionService.getPromotionBatches(
      page ? Number(page) : 1,
      perPage ? Number(perPage) : 15,
    );
  }

  /**
   * 2.2 GET /api/v1/promotions/batches/:id
   * Get promotion batch details & statistics (Admin only)
   */
  @Get('promotions/batches/:id')
  @Roles(RoleType.admin)
  async getPromotionBatchById(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.getPromotionBatchById(id);
  }

  /**
   * 2.3 POST /api/v1/promotions/preview
   * Simulate promotion and detect low enrollment warnings (Admin only)
   */
  @Post('promotions/preview')
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.OK)
  async previewPromotion(
    @Body() dto: PreviewPromotionDto,
    @CurrentUser() currentUser: any,
  ) {
    if (currentUser?.role_type && currentUser.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    return this.promotionService.previewPromotion(dto);
  }

  /**
   * 2.4 POST /api/v1/promotions/execute
   * Execute atomic batch promotion (Admin only)
   */
  @Post('promotions/execute')
  @Roles(RoleType.admin)
  @HttpCode(HttpStatus.OK)
  async executePromotion(
    @Body() dto: ExecutePromotionDto,
    @CurrentUser() currentUser: any,
    @Req() req: Request,
  ) {
    if (currentUser?.role_type && currentUser.role_type !== RoleType.admin) {
      throw new ForbiddenException('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.');
    }
    const ipAddress = req?.ip || req?.socket?.remoteAddress;
    const userAgent = req?.headers
      ? (req.headers['user-agent'] as string)
      : undefined;
    return this.promotionService.executePromotion(
      dto,
      Number(currentUser.id),
      ipAddress,
      userAgent,
    );
  }
}
