import { Module } from '@nestjs/common'
import { AuthCommonModule } from 'src/common/auth/auth-common.module'
import { DatabaseModule } from 'src/core/database/database.module'
import { PaymentAuthService } from './payment-auth.service'
import { PaymentsController } from './payments.controller'
import { PaymentsRepository } from './payments.repository'
import { PaymentsService } from './payments.service'
import { PinService } from './pin.service'

@Module({
  imports: [AuthCommonModule, DatabaseModule],
  exports: [PaymentsService, PinService, PaymentAuthService],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, PinService, PaymentAuthService],
})
export class PaymentsModule {}
