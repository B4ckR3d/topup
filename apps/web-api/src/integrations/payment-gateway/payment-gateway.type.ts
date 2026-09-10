import type { PaymentMethodFeeType, PaymentMethodProvider, PaymentStatus } from '@umbreon/db/types'

export interface PaymentGatewayOrderItem {
  name: string
  product_id: string
  price: number
  quantity: number
  customer_input?: string
}

export interface CreatePaymentRequest {
  provider_name: PaymentMethodProvider
  provider_code: string
  fee_type: PaymentMethodFeeType
  merchant_ref: string
  amount: number
  fee_percentage: number
  fee_static: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  order_items: PaymentGatewayOrderItem[]
  callback_url?: string
  return_url?: string
  expires_in_seconds: number
  user_id: string | null
}

export interface CreatePaymentResult {
  id: string
  ref_id: string
  provider_name: PaymentMethodProvider
  provider_code: string
  base_amount: number
  settlement_amount: number
  pay_amount: number
  fee_amount: number
  fee_type: PaymentMethodFeeType
  customer_name: string
  customer_email: string
  customer_phone?: string
  order_items: PaymentGatewayOrderItem[]
  callback_url?: string
  return_url?: string
  expired_at: Date
  pay_code?: string
  pay_url?: string
  qr_code?: string
  qr_url?: string
  checkout_url?: string
  status: PaymentStatus
}
