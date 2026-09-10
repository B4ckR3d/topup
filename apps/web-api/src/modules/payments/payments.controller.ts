import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiSecurity } from '@nestjs/swagger'
import { TransactionGuard } from 'src/common/auth/guards/transaction.guard'
import { User } from 'src/common/decorators/user.decorator'
import type { TUser } from 'src/common/types/meta.type'
import { ChangePinDto, ResetPinDto, SetPinDto } from './dto/pin.dto'
import { PaymentsService } from './payments.service'

@ApiSecurity('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(TransactionGuard)
  @Get('/methods/balance')
  async getBalancePayment(@User() user: TUser) {
    return await this.paymentsService.getPaymentMethodBalance(user)
  }

  @Get('/methods')
  getAllPayments() {
    return this.paymentsService.getAllPayments()
  }

  @Get('/categories')
  getPaymentCategoriers() {
    return this.paymentsService.getPaymentCategoriers()
  }

  @UseGuards(TransactionGuard)
  @Post('/pin/set')
  async setPin(@User() user: TUser, @Body() payload: SetPinDto) {
    return this.paymentsService.setPin(user, payload)
  }

  @UseGuards(TransactionGuard)
  @Post('/pin/change')
  async changePin(@User() user: TUser, @Body() payload: ChangePinDto) {
    return this.paymentsService.changePin(user, payload)
  }

  @UseGuards(TransactionGuard)
  @Post('/pin/reset')
  async resetPin(@User() user: TUser, @Body() payload: ResetPinDto) {
    return this.paymentsService.resetPin(user, payload)
  }
}
