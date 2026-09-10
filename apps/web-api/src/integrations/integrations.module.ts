import { Module } from '@nestjs/common'
import { AtlanticModule } from './h2h/atlantic/atlantic.module'
import { DigiflazzModule } from './h2h/digiflazz/digiflazz.module'
import { PaymentGatewayModule } from './payment-gateway/payment-gateway.module'

@Module({
  imports: [PaymentGatewayModule, DigiflazzModule, AtlanticModule],
  exports: [PaymentGatewayModule, DigiflazzModule, AtlanticModule],
})
export class IntegrationsModule {}
