import crypto from 'node:crypto'
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PaymentMethodFeeType, PaymentStatus } from '@umbreon/db/types'
import { ApiServiceException } from 'src/common/exceptions/api-service.exception'
import type { PaymentGateway } from '../payment.interface'
import { calculatePaymentFee } from '../payment-fee'
import type { CreatePaymentRequest, CreatePaymentResult } from '../payment-gateway.type'
import { TripayApiService } from './tripay.api.service'
import type { TripayPaymentMethodCode } from './tripay.type'

@Injectable()
export class TripayService implements PaymentGateway {
  private PRIVATE_KEY: string
  private RETURN_URL: string
  private CALLBACK_URL: string

  constructor(
    readonly configService: ConfigService,
    private readonly tripayApiService: TripayApiService,
  ) {
    this.PRIVATE_KEY = configService.get<string>('TRIPAY_PRIVATE_KEY')
    this.RETURN_URL = configService.get<string>('TRIPAY_RETURN_URL')
    this.CALLBACK_URL = configService.get<string>('TRIPAY_CALLBACK_URL')
  }

  async createTransaction(data: CreatePaymentRequest): Promise<CreatePaymentResult> {
    const expiredTime = Math.floor(Date.now() / 1000) + data.expires_in_seconds

    const amount = data.amount
    let fee = 0
    let totalAmount = 0

    if (data.fee_type === PaymentMethodFeeType.BUYER) {
      totalAmount = data.amount
    } else {
      fee = calculatePaymentFee(amount, data.fee_percentage / 100, data.fee_static)
      totalAmount = data.amount + fee
    }

    try {
      const signature = this.tripayApiService.generateClosedPaymentSignature(
        data.merchant_ref,
        totalAmount,
      )

      const response = await this.tripayApiService.createClosedPayment({
        amount: totalAmount,
        merchant_ref: data.merchant_ref,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        method: data.provider_code as TripayPaymentMethodCode,
        order_items: data.order_items,
        callback_url: data.callback_url ?? this.CALLBACK_URL ?? '',
        return_url:
          data.return_url ?? (this.RETURN_URL ? `${this.RETURN_URL}/${data.merchant_ref}` : ''),
        expired_time: expiredTime,
        customer_phone: data.customer_phone,
        signature,
      })

      return {
        base_amount: response.data.amount,
        customer_email: response.data.customer_email,
        customer_name: response.data.customer_name,
        customer_phone: response.data.customer_phone,
        settlement_amount: response.data.amount_received,
        pay_amount: totalAmount,
        fee_type: data.fee_type,
        order_items: response.data.order_items,
        provider_code: data.provider_code,
        provider_name: data.provider_name,
        ref_id: response.data.reference,
        fee_amount: response.data.total_fee,
        callback_url: response.data.callback_url,
        checkout_url: response.data.checkout_url,
        return_url: response.data.return_url,
        qr_url: response.data.qr_url,
        qr_code: response.data.qr_string,
        pay_code: response.data.pay_code,
        pay_url: response.data.pay_url,
        id: data.merchant_ref,
        expired_at: new Date(expiredTime * 1000),
        status: PaymentStatus.PENDING,
      }
    } catch (error) {
      if (error instanceof ApiServiceException) {
        throw new HttpException(error.message, error.httpCode)
      }

      throw new InternalServerErrorException(
        'Internal server error when creating Tripay transaction',
      )
    }
  }

  cancelTransaction(data: any): Promise<any> {
    throw new Error(`Method not implemented. ${data}`)
  }

  handleCallback(data: any): Promise<any> {
    throw new Error(`Method not implemented. ${data}`)
  }

  calculateFee(amountReceived: number, feeRate: number, fixedFee: number): number {
    return calculatePaymentFee(amountReceived, feeRate, fixedFee)
  }

  public generateCallbackSignature(data: object): string {
    return crypto.createHmac('sha256', this.PRIVATE_KEY).update(JSON.stringify(data)).digest('hex')
  }

  public verifyCallbackSignature({
    signature,
    data,
  }: {
    signature: string
    data: object
  }): boolean {
    const hash = this.generateCallbackSignature(data)

    return signature === hash
  }
}
