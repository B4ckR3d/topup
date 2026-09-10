import { Module } from '@nestjs/common'
import { AuthCommonModule } from 'src/common/auth/auth-common.module'
import { DatabaseModule } from 'src/core/database/database.module'
import { QueueModule } from 'src/core/queue/queue.module'
import { BalanceModule } from 'src/integrations/payment-gateway/balance/balance.module'
import { PaymentGatewayModule } from 'src/integrations/payment-gateway/payment-gateway.module'
import { DepositsController } from './deposits.controller'
import { DepositsRepository } from './deposits.repository'
import { DepositsService } from './deposits.service'

@Module({
  imports: [AuthCommonModule, DatabaseModule, PaymentGatewayModule, QueueModule, BalanceModule],
  exports: [DepositsService],
  controllers: [DepositsController],
  providers: [DepositsService, DepositsRepository],
})
export class DepositsModule {}
