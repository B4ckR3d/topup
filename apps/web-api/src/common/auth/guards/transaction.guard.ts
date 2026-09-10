import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { eq } from '@umbreon/db'
import { tb } from '@umbreon/db/types'
import type { Request } from 'express'
import { GUEST_USER } from 'src/common/constants/guest-user'
import { DatabaseService } from 'src/core/database/database.service'

@Injectable()
export class TransactionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const accessToken = this.extractTokenFromHeader(request)

    if (!accessToken) {
      request.user = GUEST_USER
      return true
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET')
      const jwt = await this.jwtService.verifyAsync(accessToken, { secret })

      if (!jwt) {
        throw new UnauthorizedException('Invalid access token')
      }

      const validateToken = await this.databaseService.db.query.sessions.findFirst({
        where: eq(tb.sessions.access_token, accessToken),
        with: {
          user: true,
        },
      })

      if (!validateToken) {
        throw Error('Invalid access token')
      }

      request.user = validateToken.user
      return true
    } catch (error: any) {
      Logger.error('TransactionGuard error:', error)
      throw new UnauthorizedException('Invalid access token')
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
