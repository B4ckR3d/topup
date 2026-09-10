import * as crypto from 'node:crypto'
import axios, { type AxiosInstance } from 'axios'
import env from '#start/env'

export type VipProductItem = {
  product_name: string
  category: string
  brand: string
  type: string
  seller_name: string
  price: number
  buyer_sku_code: string
  buyer_product_status: boolean
  seller_product_status: boolean
  unlimited_stock: boolean
  stock: number
  multi: boolean
  start_cut_off: string
  end_cut_off: string
  desc: string
  provider: 'vipreseller'
}

export class VipResellerService {
  private readonly baseUrl: string
  private readonly apiId: string
  private readonly apiKey: string
  private readonly client: AxiosInstance

  constructor() {
    this.baseUrl = env.get('VIP_RESELLER_BASE_URL') || 'https://vip-reseller.co.id/api'
    this.apiId = env.get('VIP_RESELLER_API_ID') || ''
    this.apiKey = env.get('VIP_RESELLER_API_KEY') || ''

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    })
  }

  private getSignature(): string {
    return crypto.createHash('md5').update(`${this.apiId}${this.apiKey}`).digest('hex')
  }

  /**
   * Cek Profil dan Saldo VIP-Reseller
   */
  public async checkSaldo() {
    if (!this.apiKey || !this.apiId) {
      throw new Error('VIP_RESELLER_API_ID atau VIP_RESELLER_API_KEY belum dikonfigurasi di .env')
    }

    const start = Date.now()
    const params = new URLSearchParams({
      key: this.apiKey,
      sign: this.getSignature(),
    })

    const res = await this.client.post('/profile', params.toString())
    const latency = Date.now() - start

    if (!res.data || res.data.result === false) {
      throw new Error(res.data?.message || 'Gagal memeriksa profil VIP-Reseller')
    }

    return {
      success: true,
      balance: res.data.data?.balance ?? 0,
      point: res.data.data?.point ?? 0,
      level: res.data.data?.level ?? 'Basic',
      username: res.data.data?.username ?? '',
      latency,
      message: res.data.message || 'Koneksi VIP-Reseller normal',
    }
  }

  /**
   * Ambil katalog produk Prepaid dan Game Feature dinormalisasi ke format tabel admin
   */
  public async getProducts(
    serviceType: 'prepaid' | 'game' | 'all' = 'all',
  ): Promise<VipProductItem[]> {
    if (!this.apiKey || !this.apiId) {
      throw new Error('VIP_RESELLER_API_ID atau VIP_RESELLER_API_KEY belum dikonfigurasi di .env')
    }

    const products: VipProductItem[] = []

    // 1. Fetch Prepaid jika tipe prepaid atau all
    if (serviceType === 'prepaid' || serviceType === 'all') {
      try {
        const params = new URLSearchParams({
          key: this.apiKey,
          sign: this.getSignature(),
          type: 'services',
        })
        const res = await this.client.post('/prepaid', params.toString())
        if (res.data?.result && Array.isArray(res.data.data)) {
          for (const item of res.data.data) {
            products.push({
              product_name: item.name,
              category: item.category || 'Prepaid',
              brand: item.brand || 'Umum',
              type: item.type || 'prepaid',
              seller_name: 'VIP-Reseller',
              price: item.price?.basic ?? item.price?.premium ?? 0,
              buyer_sku_code: item.code,
              buyer_product_status: item.status === 'available',
              seller_product_status: item.status === 'available',
              unlimited_stock: true,
              stock: 9999,
              multi: Boolean(item.multi_trx),
              start_cut_off: '00:00',
              end_cut_off: '00:00',
              desc: item.note || '',
              provider: 'vipreseller',
            })
          }
        }
      } catch (err: any) {
        console.error('[VipResellerService] Error fetching prepaid services:', err?.message || err)
      }
    }

    // 2. Fetch Game Feature jika tipe game atau all
    if (serviceType === 'game' || serviceType === 'all') {
      try {
        const params = new URLSearchParams({
          key: this.apiKey,
          sign: this.getSignature(),
          type: 'services',
        })
        const res = await this.client.post('/game-feature', params.toString())
        if (res.data?.result && Array.isArray(res.data.data)) {
          for (const item of res.data.data) {
            products.push({
              product_name: item.name,
              category: 'Games',
              brand: item.game || 'Game Top Up',
              type: 'game',
              seller_name: 'VIP-Reseller',
              price: item.price?.basic ?? item.price?.premium ?? 0,
              buyer_sku_code: item.code,
              buyer_product_status: item.status === 'available',
              seller_product_status: item.status === 'available',
              unlimited_stock: true,
              stock: 9999,
              multi: true,
              start_cut_off: '00:00',
              end_cut_off: '00:00',
              desc: item.description || '',
              provider: 'vipreseller',
            })
          }
        }
      } catch (err: any) {
        console.error('[VipResellerService] Error fetching game services:', err?.message || err)
      }
    }

    return products
  }
}
