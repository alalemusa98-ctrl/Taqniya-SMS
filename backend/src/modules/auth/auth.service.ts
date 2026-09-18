import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_code: loginDto.user_code },
    });

    if (!user || user.deleted_at !== null) {
      await this.auditService.log({
        action: 'login_failed',
        entityType: 'User',
        newValues: { user_code: loginDto.user_code, reason: 'user_not_found' },
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException({
        success: false,
        message: 'الرمز المؤسسي أو كلمة المرور غير صحيحة.',
      });
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      await this.auditService.log({
        userId: user.id,
        action: 'login_failed',
        entityType: 'User',
        entityId: user.id,
        newValues: { user_code: user.user_code, reason: 'invalid_password' },
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException({
        success: false,
        message: 'الرمز المؤسسي أو كلمة المرور غير صحيحة.',
      });
    }

    if (user.is_active !== 1) {
      await this.auditService.log({
        userId: user.id,
        action: 'login_blocked',
        entityType: 'User',
        entityId: user.id,
        newValues: { user_code: user.user_code, reason: 'account_inactive' },
        ipAddress,
        userAgent,
      });

      throw new ForbiddenException({
        success: false,
        message: 'هذا الحساب معطل حالياً من قِبل إدارة المدرسة.',
      });
    }

    const payload = {
      sub: user.id.toString(),
      user_code: user.user_code,
      role_type: user.role_type,
      jti: crypto.randomUUID(),
    };

    const token = this.jwtService.sign(payload);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 24 hours expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Save session in personal_access_tokens and update last_login_at
    await this.prisma.$transaction([
      this.prisma.personalAccessToken.create({
        data: {
          user_id: user.id,
          token_hash: tokenHash,
          device_name: loginDto.device_name ?? userAgent ?? 'Unknown Device',
          ip_address: ipAddress ?? null,
          expires_at: expiresAt,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      }),
    ]);

    await this.auditService.log({
      userId: user.id,
      action: 'login',
      entityType: 'User',
      entityId: user.id,
      newValues: { device_name: loginDto.device_name },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      data: {
        token,
        token_type: 'Bearer',
        expires_at: expiresAt.toISOString(),
        user: {
          id: Number(user.id),
          user_code: user.user_code,
          role_type: user.role_type,
          is_active: user.is_active,
          last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
        },
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user || user.deleted_at !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'المستخدم غير موجود.',
      });
    }

    return {
      success: true,
      message: 'تم استرجاع بيانات الملف الشخصي بنجاح.',
      data: {
        id: Number(user.id),
        user_code: user.user_code,
        role_type: user.role_type,
        is_active: user.is_active,
        last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
        created_at: user.created_at.toISOString(),
      },
    };
  }

  async logout(userId: number, tokenId: number, ipAddress?: string, userAgent?: string) {
    await this.prisma.personalAccessToken.deleteMany({
      where: { id: BigInt(tokenId) },
    });

    await this.auditService.log({
      userId: BigInt(userId),
      action: 'logout',
      entityType: 'PersonalAccessToken',
      entityId: BigInt(tokenId),
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تسجيل الخروج بنجاح وإبطال جلسة العمل.',
    };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (dto.new_password !== dto.new_password_confirmation) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.',
        errors: {
          new_password_confirmation: ['تأكيد كلمة المرور غير مطابق.'],
        },
      });
    }

    if (dto.new_password === dto.current_password) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية.',
        errors: {
          new_password: ['كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية.'],
        },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'المستخدم غير موجود.',
      });
    }

    const isCurrentValid = await bcrypt.compare(dto.current_password, user.password);
    if (!isCurrentValid) {
      throw new UnprocessableEntityException({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة.',
        errors: {
          current_password: ['كلمة المرور الحالية غير صحيحة.'],
        },
      });
    }

    const newHashedPassword = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: newHashedPassword },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'password_change',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح.',
    };
  }
}
