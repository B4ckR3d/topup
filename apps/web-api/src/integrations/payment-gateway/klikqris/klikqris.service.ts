import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PaymentMethodFeeType, PaymentMethodProvider, PaymentStatus } from '@umbreon/db/types'
import { ApiServiceException } from 'src/common/exceptions/api-service.exception'
import type { PaymentGateway } from '../payment.interface'
import { calculatePaymentFee } from '../payment-fee'
import type { CreatePaymentRequest, CreatePaymentResult } from '../payment-gateway.type'
import { KlikQrisApiService } from './klikqris.api.service'
import type { KlikQrisWebhookPayload } from './klikqris.type'

@Injectable()
export class KlikQrisService implements PaymentGateway {
  private readonly CALLBACK_URL: string
  private readonly RETURN_URL: string

  constructor(
    private readonly configService: ConfigService,
    private readonly klikQrisApiService: KlikQrisApiService,
  ) {
    this.CALLBACK_URL =
      this.configService.get<string>('KLIKQRIS_CALLBACK_URL') ||
      'http://localhost:9991/api/v1/callback/payment/klikqris'
    this.RETURN_URL =
      this.configService.get<string>('KLIKQRIS_RETURN_URL') ||
      'http://localhost:9992/payment/finish'
  }

  async createTransaction(data: CreatePaymentRequest): Promise<CreatePaymentResult> {
    const amount = data.amount
    let fee = 0
    let totalAmount = 0

    if (data.fee_type === PaymentMethodFeeType.BUYER) {
      totalAmount = data.amount
    } else {
      fee = this.calculateFee(amount, data.fee_percentage / 100, data.fee_static)
      totalAmount = data.amount + fee
    }

    try {
      const response = await this.klikQrisApiService.createQrisTransaction({
        order_id: data.merchant_ref,
        amount: totalAmount,
        keterangan: `Payment #${data.merchant_ref}`,
        callback_url: data.callback_url ?? this.CALLBACK_URL,
      })

      const baseAmount = Number(response.amount) || amount
      const finalPayAmount = Number(response.total_amount) || totalAmount
      const feeAmount = finalPayAmount - baseAmount
      const expiredAt = response.expired_at
        ? new Date(response.expired_at)
        : new Date(Date.now() + data.expires_in_seconds * 1000)

      return {
        id: data.merchant_ref,
        ref_id: response.signature, // Simpan signature KlikQRIS untuk double validation webhook
        provider_name: PaymentMethodProvider.KLIKQRIS,
        provider_code: data.provider_code,
        base_amount: baseAmount,
        settlement_amount: baseAmount,
        pay_amount: finalPayAmount,
        fee_amount: feeAmount,
        fee_type: data.fee_type,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        order_items: data.order_items,
        callback_url: data.callback_url ?? this.CALLBACK_URL,
        return_url:
          data.return_url ?? (this.RETURN_URL ? `${this.RETURN_URL}/${data.merchant_ref}` : ''),
        qr_code: response.qris_image, // Data URL Base64 image
        qr_url: response.qris_url ?? undefined,
        pay_url: response.redirect_url ?? undefined,
        expired_at: expiredAt,
        status: PaymentStatus.PENDING,
      }
    } catch (error) {
      if (error instanceof ApiServiceException) {
        throw new HttpException(error.message, error.httpCode)
      }

      throw new InternalServerErrorException(
        'Internal server error when creating KlikQRIS transaction',
      )
    }
  }

  calculateFee(amountReceived: number, feeRate: number, fixedFee: number): number {
    return calculatePaymentFee(amountReceived, feeRate, fixedFee)
  }

  cancelTransaction(data: any): Promise<any> {
    throw new Error(`Method not implemented. ${data}`)
  }

  handleCallback(data: any): Promise<any> {
    throw new Error(`Method not implemented. ${data}`)
  }

  /**
   * Validasi struktur payload webhook KlikQRIS
   */
  verifyCallbackPayload(payload: KlikQrisWebhookPayload): boolean {
    return Boolean(payload?.order_id && payload?.signature)
  }
}
