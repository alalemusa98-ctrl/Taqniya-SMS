import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '@prisma/client';
import type { Request } from 'express';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.admin)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getUsers(
    @Query('role_type') roleType?: RoleType,
    @Query('is_active') isActive?: number,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
  ) {
    return this.usersService.findAllTree({
      role_type: roleType,
      is_active: isActive,
      search,
      page,
      per_page: perPage,
    });
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.usersService.updateStatus(id, dto, adminUser.id, ip, userAgent);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResetPasswordDto,
    @CurrentUser() adminUser: any,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.usersService.resetPassword(id, dto, adminUser.id, ip, userAgent);
  }
}
