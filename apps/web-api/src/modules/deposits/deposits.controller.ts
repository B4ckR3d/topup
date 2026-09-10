import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiParam, ApiSecurity } from '@nestjs/swagger'
import { JwtAuthGuard } from 'src/common/auth/guards/jwt.guard'
import { User } from 'src/common/decorators/user.decorator'
import type { TUser } from 'src/common/types/meta.type'
import { DepositsService } from './deposits.service'
import { CreateDeposit, DepositHistoryQuery, DepositParams } from './dto/deposits.dto'

@ApiSecurity('access-token')
@UseGuards(JwtAuthGuard)
@Controller('deposit')
export class DepositsController {
  constructor(private readonly depositService: DepositsService) {}

  @Get('/payment-methods')
  async getDepositMethods() {
    return this.depositService.getDepositMethods()
  }

  @Get('/history')
  async getDepositHistory(@Query() query: DepositHistoryQuery, @User() user: TUser) {
    return this.depositService.getDespositHistory(query, user.id)
  }

  @Post('/create')
  async createDeposit(@Body() data: CreateDeposit, @User() user: TUser) {
    return this.depositService.createDeposit(data, user)
  }

  @ApiParam({
    name: 'depositId',
    type: String,
    description: 'The ID of the deposit to retrieve details for',
  })
  @Get('/:depositId')
  async getDepositDetail(@Param() params: DepositParams, @User() user: TUser) {
    const { depositId } = params
    return this.depositService.getDepositDetail(depositId, user.id)
  }

  @ApiParam({
    name: 'depositId',
    type: String,
    description: 'The ID of the deposit to cancel',
  })
  @Post('/:depositId/cancel')
  async cancelDeposit(@Param() params: DepositParams, @User() user: TUser) {
    const { depositId } = params
    return this.depositService.cancelDeposit(depositId, user.id)
  }
}
