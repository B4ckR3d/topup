import type { DBInstance } from 'src/common/types/db-instance'
import type { CreatePaymentRequest, CreatePaymentResult } from './payment-gateway.type'

export interface PaymentCreator {
  createTransaction(data: CreatePaymentRequest, tx?: DBInstance): Promise<CreatePaymentResult>
}

export interface PaymentGateway extends PaymentCreator {
  cancelTransaction(data: any): Promise<any>

  handleCallback(data: any): Promise<any>

  calculateFee(amountReceived: number, feeRate: number, fixedFee: number): number
}
