import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { BackupService } from './backup.service.js';
import { CreateBackupDto } from './dto/create-backup.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('api/v1/backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  async listBackups() {
    const data = await this.backupService.listBackups();
    return {
      success: true,
      data,
    };
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createBackup(@Body() dto: CreateBackupDto) {
    const data = await this.backupService.createBackup(dto?.note);
    return {
      success: true,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح.',
      data,
    };
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackup(@UploadedFile() file: Express.Multer.File) {
    const data = await this.backupService.uploadBackup(file);
    return {
      success: true,
      message: 'تم رفع النسخة الاحتياطية بنجاح.',
      data,
    };
  }

  @Post('restore/:filename')
  @HttpCode(HttpStatus.OK)
  async restoreBackup(@Param('filename') filename: string) {
    const data = await this.backupService.restoreBackup(filename);
    return {
      success: true,
      message: 'تمت استعادة قاعدة البيانات من النسخة الاحتياطية بنجاح.',
      data,
    };
  }

  @Get('download/:filename')
  downloadBackup(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.backupService.getBackupFilePath(filename);
    res.download(filePath, filename);
  }

  @Delete(':filename')
  async deleteBackup(@Param('filename') filename: string) {
    const data = await this.backupService.deleteBackup(filename);
    return {
      success: true,
      message: 'تم حذف النسخة الاحتياطية بنجاح.',
      data,
    };
  }
}
