import { Module } from '@nestjs/common'
import { DatabaseModule } from 'src/core/database/database.module'
import { QueueModule } from 'src/core/queue/queue.module'
import { DigiflazzModule } from 'src/integrations/h2h/digiflazz/digiflazz.module'
import { BalanceModule } from 'src/integrations/payment-gateway/balance/balance.module'
import { DuitkuModule } from 'src/integrations/payment-gateway/duitku/duitku.module'
import { KlikQrisModule } from 'src/integrations/payment-gateway/klikqris/klikqris.module'
import { TripayModule } from 'src/integrations/payment-gateway/tripay/tripay.module'
import { DepositsModule } from 'src/modules/deposits/deposits.module'
import { OffersModule } from 'src/modules/offers/offers.module'
import { OrdersModule } from 'src/modules/orders/orders.module'
import { ProductsModule } from 'src/modules/products/products.module'
import { DigiflazzH2HCallbackService } from './h2h/digiflazz-h2h-callback.service'
import { H2HCallbackController } from './h2h/h2h-callback.controller'
import { H2HCallbackService } from './h2h/h2h-callback.service'
import { PaymentGatewayCallbackController } from './payment-gateway/payment-gateway-callback.controller'
import { PaymentGatewayCallbackService } from './payment-gateway/payment-gateway-callback.service'

@Module({
  imports: [
    DatabaseModule,
    TripayModule,
    BalanceModule,
    DigiflazzModule,
    QueueModule,
    DuitkuModule,
    KlikQrisModule,
    OrdersModule,
    ProductsModule,
    OffersModule,
    DepositsModule,
  ],
  controllers: [PaymentGatewayCallbackController, H2HCallbackController],
  providers: [PaymentGatewayCallbackService, DigiflazzH2HCallbackService, H2HCallbackService],
})
export class CallbackModule {}
