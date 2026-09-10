import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'

import { ApiSecurity } from '@nestjs/swagger'
import { JwtAuthGuard } from 'src/common/auth/guards/jwt.guard'
import { TransactionGuard } from 'src/common/auth/guards/transaction.guard'
import { User } from 'src/common/decorators/user.decorator'
import type { TUser } from 'src/common/types/meta.type'
import type { GetBalanceMutationHistoryQuery } from './dto/users.dto'
import { UsersService } from './users.service'

@ApiSecurity('access-token')
@Controller('user')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(TransactionGuard)
  @Get('/me')
  me(@User() user: TUser) {
    return this.userService.me(user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async getProfile(@User() user: TUser) {
    return await this.userService.getUserById(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/balance')
  async getBalance(@User() user: TUser) {
    return await this.userService.getBalance(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/balance/mutations')
  async getBalanceMutationHistory(
    @User() user: TUser,
    @Query() query: GetBalanceMutationHistoryQuery,
  ) {
    return await this.userService.getBalanceMutationHistory(query, user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/security-info')
  async getSecurityInfo(@User() user: TUser) {
    return await this.userService.getSecurityInfo(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/dashboard')
  async dashboard(@User() user: TUser) {
    return await this.userService.dashboard(user)
  }

  // Passkeys
  @UseGuards(JwtAuthGuard)
  @Get('/passkeys')
  async getUserPasskeys(@User() user: TUser) {
    return await this.userService.getAllPasskeys(user)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/passkeys/:passkeyId')
  async destroyUserPasskey(
    @User() user: TUser,
    @Param('passkeyId', ParseUUIDPipe) passkeyId: string,
  ) {
    return await this.userService.destroyPasskey(user, passkeyId)
  }

  // Sessions
  @UseGuards(JwtAuthGuard)
  @Get('/sessions')
  async getUserSessions(@User() user: TUser, @Headers('Authorization') authHeader: string) {
    const accessToken = authHeader?.replace('Bearer ', '')
    return await this.userService.getAllSessions(user, accessToken)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/sessions/:sessionId/destroy')
  async destroyUserSession(
    @User() user: TUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return await this.userService.destroySession(user, sessionId)
  }
}
