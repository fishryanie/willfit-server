import { Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = TokenPayload>(error: unknown, user: TUser, info: unknown, context: ExecutionContext): TUser {
    if (error || !user) {
      throw error || new UnauthorizedException((info as Error | undefined)?.message || 'Access denied! no token provided.')
    }
    context.switchToHttp().getRequest<TokenVerifiedRequest>().tokenVerified = user as unknown as TokenPayload
    return user
  }
}
