import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'taqniya_sms_super_secret_jwt_key_2026',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!rawToken) {
      throw new UnauthorizedException({
        success: false,
        message: 'غير مصرح بالوصول. التوكن مفقود.',
      });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Check if token session exists in personal_access_tokens
    const session = await this.prisma.personalAccessToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!session || new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedException({
        success: false,
        message: 'غير مصرح بالوصول. التوكن غير صالح أو منتهي الصلاحية.',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(payload.sub) },
    });

    if (!user || user.deleted_at !== null) {
      throw new UnauthorizedException({
        success: false,
        message: 'غير مصرح بالوصول. المستخدم غير موجود.',
      });
    }

    if (user.is_active !== 1) {
      throw new UnauthorizedException({
        success: false,
        message: 'هذا الحساب معطل حالياً من قِبل إدارة المدرسة.',
      });
    }

    // Update last_used_at for the token
    await this.prisma.personalAccessToken.update({
      where: { id: session.id },
      data: { last_used_at: new Date() },
    });

    return {
      id: Number(user.id),
      user_code: user.user_code,
      role_type: user.role_type,
      is_active: user.is_active,
      token_id: Number(session.id),
    };
  }
}
