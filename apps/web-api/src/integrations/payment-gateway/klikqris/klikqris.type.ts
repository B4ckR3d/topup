export interface KlikQrisCreatePayload {
  order_id: string
  id_merchant?: string
  amount: number
  keterangan?: string
  callback_url?: string
}

export interface KlikQrisCreateResponseData {
  order_id: string
  nama_toko: string
  tanggal: string
  notifwa: number
  mdr: string
  redirect_url: string
  amount_uniq: string
  amount: string
  total_amount: string
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED'
  notified_expired: number
  qris_url: string | null
  expired_at: string
  paid_at: string | null
  signature: string
  keterangan: string
  expired_menit: string
  created_at: string
  updated_at: string
  qris_image: string
}

export interface KlikQrisApiResponse<T> {
  status: boolean
  message?: string
  data: T
}

export interface KlikQrisWebhookPayload {
  order_id: string
  status: 'PAID' | 'EXPIRED' | 'SUCCESS'
  amount: number
  total_amount: number
  payment_date?: string
  created_at?: string
  updated_at?: string
  keterangan?: string
  direct_url?: string
  signature: string
}
