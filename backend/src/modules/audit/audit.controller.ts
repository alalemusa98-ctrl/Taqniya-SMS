import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RoleType } from '@prisma/client';

@Controller('api/v1/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
    @Query('action') action?: string,
    @Query('entity_type') entityType?: string,
    @Query('user_id') userId?: number,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_order') sortOrder?: 'asc' | 'desc',
  ) {
    return this.auditService.findAll({
      page,
      per_page: perPage,
      action,
      entity_type: entityType,
      user_id: userId,
      date_from: dateFrom || fromDate,
      date_to: dateTo || toDate,
      sort_by: sortBy,
      sort_order: sortOrder,
    });
  }

  @Get(':id')
  async getAuditLogById(@Param('id', ParseIntPipe) id: number) {
    const log = await this.auditService.findOne(id);
    if (!log) {
      throw new NotFoundException({
        success: false,
        message: 'سجل حركة التدقيق غير موجود.',
      });
    }

    return {
      success: true,
      message: 'تم جلب تفاصيل حركة التدقيق بنجاح.',
      data: log,
    };
  }
}
