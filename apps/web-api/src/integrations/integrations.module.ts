import { Module } from '@nestjs/common'
import { AtlanticModule } from './h2h/atlantic/atlantic.module'
import { DigiflazzModule } from './h2h/digiflazz/digiflazz.module'
import { VipResellerModule } from './h2h/vipreseller/vip-reseller.module'
import { PaymentGatewayModule } from './payment-gateway/payment-gateway.module'

@Module({
  imports: [PaymentGatewayModule, DigiflazzModule, AtlanticModule, VipResellerModule],
  exports: [PaymentGatewayModule, DigiflazzModule, AtlanticModule, VipResellerModule],
})
export class IntegrationsModule {}
