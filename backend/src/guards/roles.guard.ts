import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { jwtPayload } from 'src/utils/types/jwt-payload'; // adjust path if needed

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restriction, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as jwtPayload;

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
