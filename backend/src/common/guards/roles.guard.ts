import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role_type) {
      throw new ForbiddenException({
        success: false,
        message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      });
    }

    const hasRole = requiredRoles.includes(user.role_type);
    if (!hasRole) {
      throw new ForbiddenException({
        success: false,
        message: 'ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء.',
      });
    }

    return true;
  }
}
