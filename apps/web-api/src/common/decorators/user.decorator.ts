import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { TUser } from 'src/common/types/meta.type'

interface RequestWithUser extends Request {
  user?: TUser | null
}

export const User = createParamDecorator((_data: unknown, ctx: ExecutionContext): TUser | null => {
  const request: Request = ctx.switchToHttp().getRequest()
  return (request as RequestWithUser).user || null
})
