import { BadRequestException, Injectable } from '@nestjs/common'
import { PaymentMethodProvider, PaymentStatus } from '@umbreon/db/types'
import { SendResponse } from 'src/common/utils/response'
import { DuitkuService } from 'src/integrations/payment-gateway/duitku/duitku.service'
import type { DuitkuCallbackPayload } from 'src/integrations/payment-gateway/duitku/duitku.type'
import { KlikQrisService } from 'src/integrations/payment-gateway/klikqris/klikqris.service'
import type { KlikQrisWebhookPayload } from 'src/integrations/payment-gateway/klikqris/klikqris.type'
import { TripayService } from 'src/integrations/payment-gateway/tripay/tripay.service'
import type { TripayCallbackData } from 'src/integrations/payment-gateway/tripay/tripay.type'
import { DepositsService } from 'src/modules/deposits/deposits.service'
import { OrdersService } from 'src/modules/orders/services/orders.service'

@Injectable()
export class PaymentGatewayCallbackService {
  constructor(
    private readonly tripayService: TripayService,
    private readonly duitkuService: DuitkuService,
    private readonly klikQrisService: KlikQrisService,
    private readonly orderService: OrdersService,
    private readonly depositService: DepositsService,
  ) {}

  async handleTripay(payload: TripayCallbackData, signature: string) {
    const isSignatureValid = this.tripayService.verifyCallbackSignature({
      data: payload,
      signature: signature,
    })

    if (!isSignatureValid) {
      throw new BadRequestException('Invalid signature')
    }

    const paymentStatus = payload.status === 'PAID' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED
    const merchantRef = payload.merchant_ref
    const referenceType = this.getPaymentReferenceType(merchantRef)

    if (referenceType === 'order') {
      const result = await this.orderService.handlePaymentCallback(
        merchantRef,
        paymentStatus,
        PaymentMethodProvider.TRIPAY,
      )

      return SendResponse.success(result)
    } else if (referenceType === 'deposit') {
      const result = await this.depositService.handlePaymentCallback(merchantRef, paymentStatus)

      return SendResponse.success(result)
    } else {
      throw new BadRequestException('Unknown payment reference type')
    }
  }

  public async handleDuitku(payload: DuitkuCallbackPayload) {
    const isSignatureValid = this.duitkuService.verifyCallbackSignature({
      signature: payload.signature,
      merchantCode: payload.merchantCode,
      amount: payload.amount,
      merchantOrderId: payload.merchantOrderId,
    })

    if (!isSignatureValid) {
      throw new BadRequestException('Invalid signature')
    }

    const paymentStatus = payload.resultCode === '00' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED
    const merchantRef = payload.merchantOrderId
    const referenceType = this.getPaymentReferenceType(merchantRef)

    if (referenceType === 'order') {
      const result = await this.orderService.handlePaymentCallback(
        merchantRef,
        paymentStatus,
        PaymentMethodProvider.DUITKU,
      )

      return SendResponse.success(result)
    } else if (referenceType === 'deposit') {
      const result = await this.depositService.handlePaymentCallback(merchantRef, paymentStatus)

      return SendResponse.success(result)
    } else {
      throw new BadRequestException('Unknown payment reference type')
    }
  }

  public async handleKlikQris(payload: KlikQrisWebhookPayload) {
    if (!this.klikQrisService.verifyCallbackPayload(payload)) {
      return { status: false, message: 'Invalid KlikQRIS webhook payload' }
    }

    const paymentStatus =
      payload.status === 'PAID' || payload.status === 'SUCCESS'
        ? PaymentStatus.SUCCESS
        : PaymentStatus.FAILED

    const merchantRef = payload.order_id
    const referenceType = this.getPaymentReferenceType(merchantRef)

    try {
      if (referenceType === 'order') {
        const result = await this.orderService.handlePaymentCallback(
          merchantRef,
          paymentStatus,
          PaymentMethodProvider.KLIKQRIS,
        )

        return { status: true, message: 'Webhook processed', data: result }
      } else if (referenceType === 'deposit') {
        const result = await this.depositService.handlePaymentCallback(merchantRef, paymentStatus)

        return { status: true, message: 'Webhook processed', data: result }
      } else {
        return { status: false, message: 'Unknown payment reference type' }
      }
    } catch (error: any) {
      return { status: false, message: error?.message || 'Failed to process webhook' }
    }
  }

  private getPaymentReferenceType(reference: string): 'order' | 'deposit' | null {
    const normalizedReference = reference.toLowerCase()

    if (normalizedReference.startsWith('t')) return 'order'
    if (normalizedReference.startsWith('depo')) return 'deposit'

    return null
  }
}
