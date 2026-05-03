import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { RoleAccount } from 'enums/common'
import { ROLES_KEY } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<RoleAccount[]>(ROLES_KEY, [context.getHandler(), context.getClass()])
    if (!requiredRoles?.length) return true

    const request = context.switchToHttp().getRequest<TokenVerifiedRequest>()
    const roleName = request.tokenVerified?.role?.name
    return Boolean(roleName && requiredRoles.includes(roleName))
  }
}
