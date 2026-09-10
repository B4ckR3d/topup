import crypto from 'node:crypto'
import { HttpException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PaymentMethodFeeType, PaymentStatus } from '@umbreon/db/types'
import { ApiServiceException } from 'src/common/exceptions/api-service.exception'
import type { PaymentGateway } from '../payment.interface'
import type { CreatePaymentRequest, CreatePaymentResult } from '../payment-gateway.type'
import { DuitkuAPiService } from './duitku.api.service'

@Injectable()
export class DuitkuService implements PaymentGateway {
  private API_KEY: string
  private MERCHANT_CODE: string
  private RETURN_URL: string
  private CALLBACK_URL: string

  constructor(
    private readonly duitkuApiService: DuitkuAPiService,
    private readonly configService: ConfigService,
  ) {
    this.API_KEY = this.configService.get<string>('DUITKU_APIKEY')
    this.MERCHANT_CODE = this.configService.get<string>('DUITKU_MERCHANT_CODE')
    this.RETURN_URL = this.configService.get<string>('DUITKU_RETURN_URL')
    this.CALLBACK_URL = this.configService.get<string>('DUITKU_CALLBACK_URL')
  }

  async createTransaction(data: CreatePaymentRequest): Promise<CreatePaymentResult> {
    try {
      const expiryPeriod = data.expires_in_seconds * 60
      const expiredAt = new Date(Date.now() + data.expires_in_seconds * 1000)

      //   hitung fee
      const amount = data.amount

      let totalAmount = 0

      const fee = this.duitkuApiService.calculateFee(
        amount,
        data.fee_percentage / 100,
        data.fee_static,
      )

      if (data.fee_type === PaymentMethodFeeType.BUYER) {
        totalAmount = data.amount
      } else {
        totalAmount = data.amount + fee
      }

      const signature = this.duitkuApiService.generateSignature(
        this.MERCHANT_CODE + data.merchant_ref + totalAmount + this.API_KEY,
      )

      const response = await this.duitkuApiService.createTransaction({
        merchantCode: this.MERCHANT_CODE,
        paymentAmount: totalAmount,
        paymentMethod: data.provider_code,
        email: data.customer_email,
        customerVaName: data.customer_name,
        phoneNumber: data.customer_phone,
        callbackUrl: data.callback_url ?? this.CALLBACK_URL ?? '',
        expiryPeriod: expiryPeriod,
        merchantOrderId: data.merchant_ref,
        signature: signature,
        returnUrl:
          data.return_url ?? (this.RETURN_URL ? `${this.RETURN_URL}/${data.merchant_ref}` : ''),
      })

      // Data Setelah Revisi Create Payment
      let feeAmount = 0
      let settlementAmount = 0
      const payAmount = response.amount

      if (data.fee_type === PaymentMethodFeeType.BUYER) {
        feeAmount = response.amount - data.amount
        settlementAmount = response.amount - feeAmount
      } else {
        feeAmount = fee
        settlementAmount = response.amount - feeAmount
      }

      return {
        base_amount: data.amount,
        settlement_amount: settlementAmount,
        fee_type: data.fee_type,
        pay_amount: payAmount,
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        expired_at: expiredAt,
        id: data.merchant_ref,
        order_items: data.order_items,
        provider_code: data.provider_code,
        provider_name: data.provider_name,
        ref_id: response.reference,
        fee_amount: feeAmount,
        customer_phone: data.customer_phone,
        pay_url: response.paymentUrl,
        pay_code: response.vaNumber,
        qr_code: response.qrString,
        qr_url: null,
        status: PaymentStatus.PENDING,
      }
    } catch (error) {
      if (error instanceof ApiServiceException) {
        throw new HttpException(error.message, error.httpCode)
      }
      throw error
    }
  }

  cancelTransaction(data: any): Promise<any> {
    throw new Error(`Method not implemented. ${data}`)
  }

  handleCallback(data: any): Promise<any> {
    throw new Error(`Method not implemented. ${data}`)
  }

  calculateFee(amountReceived: number, feeRate: number, fixedFee: number): number {
    throw new Error(`Method not implemented. ${amountReceived}, ${feeRate}, ${fixedFee}`)
  }

  public verifyCallbackSignature(data: {
    signature: string
    merchantCode: string
    amount: number
    merchantOrderId: string
  }): boolean {
    const hash = crypto
      .createHash('md5')
      .update(data.merchantCode + data.amount + data.merchantOrderId + this.API_KEY)
      .digest('hex')

    return hash === data.signature
  }
}
