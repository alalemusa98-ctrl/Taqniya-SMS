import { Controller, Get, Param, Res, UseGuards, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { StorageService } from './storage.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('api/v1/storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':entityType/:entityId/:filename')
  @UseGuards(JwtAuthGuard)
  serveFile(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const relativePath = `${entityType}/${entityId}/${filename}`;
    const { fullPath, filename: safeName } = this.storageService.getFilePath(relativePath);
    res.download(fullPath, safeName);
  }
}
