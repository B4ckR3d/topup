import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OrderStatus, ProductProvider } from '@umbreon/db/types'
import { DatabaseService } from 'src/core/database/database.service'
import { QueueService } from 'src/core/queue/queue.service'
import { StorageService } from 'src/core/storage/storage.service'
import { DigiflazzService } from 'src/integrations/h2h/digiflazz/digiflazz.service'
import { PaymentGatewayService } from 'src/integrations/payment-gateway/payment-gateway.service'
import { OffersService } from 'src/modules/offers/offers.service'
import { PaymentsService } from 'src/modules/payments/payments.service'
import type { GetInquiryFromProviderInput } from '../types/inquiry.types'

@Injectable()
export class InquiryService {
  constructor(
    readonly _databaseService: DatabaseService,
    readonly _configService: ConfigService,
    readonly _paymentGatewayService: PaymentGatewayService,
    readonly _queueService: QueueService,
    readonly _offerService: OffersService,
    readonly _paymentService: PaymentsService,
    readonly _storageService: StorageService,
    private readonly digiflazzService: DigiflazzService,
  ) {}

  async getInquiryFromProvider(data: GetInquiryFromProviderInput) {
    switch (data.product_provider_name) {
      case ProductProvider.DIGIFLAZZ: {
        const response = await this.digiflazzService.cekTagihan({
          customer_input: data.customer_input,
          provider_code: data.provider_code,
          inquiry_id: data.inquiry_id,
          amount: data.amount,
          year: data.year,
        })

        if (response.status !== OrderStatus.COMPLETED) {
          throw new BadRequestException(response.message || 'Failed to get inquiry from provider')
        }

        return response
      }

      default: {
        throw new BadRequestException('Unsupported provider for inquiry')
      }
    }
  }
}
