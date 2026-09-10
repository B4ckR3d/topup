import { forwardRef, Module } from '@nestjs/common'
import { AuthCommonModule } from 'src/common/auth/auth-common.module'
import { DatabaseModule } from 'src/core/database/database.module'
import { QueueModule } from 'src/core/queue/queue.module'
import { DigiflazzModule } from 'src/integrations/h2h/digiflazz/digiflazz.module'
import { BalanceModule } from 'src/integrations/payment-gateway/balance/balance.module'
import { PaymentGatewayModule } from 'src/integrations/payment-gateway/payment-gateway.module'
import { OffersModule } from 'src/modules/offers/offers.module'
import { PaymentsModule } from 'src/modules/payments/payments.module'
import { ProductsModule } from 'src/modules/products/products.module'
import { OrdersController } from './orders.controller'
import { OrdersRepository } from './orders.repository'
import { DigiflazzOrderProcessor } from './processor/digiflazz.processor'
import { OrdersProcessor } from './processor/orders.processor'
import { InquiryService } from './services/inquiry.service'
import { OrdersService } from './services/orders.service'
import { RefundService } from './services/refund.service'

@Module({
  imports: [
    PaymentGatewayModule,
    forwardRef(() => QueueModule),
    AuthCommonModule,
    DatabaseModule,
    OffersModule,
    PaymentsModule,
    DigiflazzModule,
    ProductsModule,
    BalanceModule,
  ],
  exports: [OrdersProcessor, OrdersRepository, OrdersService, RefundService],
  controllers: [OrdersController],
  providers: [
    OrdersRepository,
    OrdersService,
    InquiryService,
    RefundService,
    OrdersProcessor,
    DigiflazzOrderProcessor,
  ],
})
export class OrdersModule {}
