import * as crypto from 'node:crypto'
import axios from 'axios'
import env from '#start/env'
import { DigiflazzService } from './digiflazz_service.js'
import { VipResellerService } from './vip_reseller_service.js'

export type GatewayTestResult = {
  id: string
  name: string
  type: 'payment_gateway' | 'h2h_provider'
  status: 'connected' | 'error' | 'not_configured'
  latencyMs: number
  balance?: number | string
  message: string
  details?: Record<string, any>
}

export class GatewayTesterService {
  /**
   * Test Koneksi KlikQRIS (Dynamic QRIS)
   */
  public static async testKlikQris(): Promise<GatewayTestResult> {
    const apiKey = env.get('KLIKQRIS_API_KEY')
    const merchantId = env.get('KLIKQRIS_MERCHANT_ID')
    const baseUrl = env.get('KLIKQRIS_BASE_URL') || 'https://klikqris.com/api'

    if (!apiKey || apiKey === 'your_api_key_here' || !merchantId) {
      return {
        id: 'klikqris',
        name: 'KlikQRIS (Dynamic QRIS)',
        type: 'payment_gateway',
        status: 'not_configured',
        latencyMs: 0,
        message: 'Kredensial KLIKQRIS_API_KEY atau KLIKQRIS_MERCHANT_ID belum diisi di .env',
      }
    }

    const start = Date.now()
    try {
      // Test request to KlikQRIS
      const res = await axios.post(
        `${baseUrl.replace(/\/+$/, '')}/qris/create`,
        {
          order_id: `PING-${Date.now()}`,
          id_merchant: merchantId,
          amount: 1000,
          keterangan: 'Ping connection test',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            id_merchant: merchantId,
          },
          timeout: 10000,
        },
      )
      const latency = Date.now() - start
      return {
        id: 'klikqris',
        name: 'KlikQRIS (Dynamic QRIS)',
        type: 'payment_gateway',
        status: 'connected',
        latencyMs: latency,
        message: res.data?.message || 'Koneksi KlikQRIS Aktif & Normal',
      }
    } catch (err: any) {
      const latency = Date.now() - start
      // If error response exists from KlikQRIS API, connection was established
      if (err.response?.data?.message) {
        const msg = err.response.data.message
        if (msg.includes('Saldo') || msg.includes('Minimal') || msg.includes('order_id')) {
          return {
            id: 'klikqris',
            name: 'KlikQRIS (Dynamic QRIS)',
            type: 'payment_gateway',
            status: 'connected',
            latencyMs: latency,
            message: `Terhubung (Response: ${msg})`,
          }
        }
        return {
          id: 'klikqris',
          name: 'KlikQRIS (Dynamic QRIS)',
          type: 'payment_gateway',
          status: 'error',
          latencyMs: latency,
          message: `KlikQRIS Error: ${msg}`,
        }
      }
      return {
        id: 'klikqris',
        name: 'KlikQRIS (Dynamic QRIS)',
        type: 'payment_gateway',
        status: 'error',
        latencyMs: latency,
        message: err?.message || 'Gagal menghubungi server KlikQRIS',
      }
    }
  }

  /**
   * Test Koneksi TriPay
   */
  public static async testTripay(): Promise<GatewayTestResult> {
    const apiKey = env.get('TRIPAY_APIKEY')
    const merchantCode = env.get('TRIPAY_MERCHANT_CODE')
    const isProduction = env.get('NODE_ENV') === 'production'
    const baseUrl = isProduction ? 'https://tripay.co.id/api' : 'https://tripay.co.id/api-sandbox'

    if (!apiKey || apiKey.trim() === '') {
      return {
        id: 'tripay',
        name: 'TriPay Payment Gateway',
        type: 'payment_gateway',
        status: 'not_configured',
        latencyMs: 0,
        message: 'Kredensial TRIPAY_APIKEY belum diisi di .env',
      }
    }

    const start = Date.now()
    try {
      const res = await axios.get(`${baseUrl}/merchant/payment-channel`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      })
      const latency = Date.now() - start
      const channels = res.data?.data?.length || 0
      return {
        id: 'tripay',
        name: 'TriPay Payment Gateway',
        type: 'payment_gateway',
        status: 'connected',
        latencyMs: latency,
        message: `Terkoneksi normal (${channels} channel aktif)`,
        details: { merchantCode },
      }
    } catch (err: any) {
      const latency = Date.now() - start
      return {
        id: 'tripay',
        name: 'TriPay Payment Gateway',
        type: 'payment_gateway',
        status: 'error',
        latencyMs: latency,
        message: err?.response?.data?.message || err?.message || 'Gagal terhubung ke TriPay',
      }
    }
  }

  /**
   * Test Koneksi Duitku
   */
  public static async testDuitku(): Promise<GatewayTestResult> {
    const merchantCode = env.get('DUITKU_MERCHANT_CODE')
    const apiKey = env.get('DUITKU_API_KEY')

    if (!merchantCode || !apiKey) {
      return {
        id: 'duitku',
        name: 'Duitku Payment Gateway',
        type: 'payment_gateway',
        status: 'not_configured',
        latencyMs: 0,
        message: 'Kredensial DUITKU_MERCHANT_CODE atau DUITKU_API_KEY belum diisi di .env',
      }
    }

    const start = Date.now()
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = crypto
        .createHash('sha256')
        .update(`${merchantCode}${timestamp}${apiKey}`)
        .digest('hex')

      const res = await axios.post(
        'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod',
        {
          merchantcode: merchantCode,
          amount: 10000,
          datetime: timestamp,
          signature,
        },
        { timeout: 10000 },
      )
      const latency = Date.now() - start
      return {
        id: 'duitku',
        name: 'Duitku Payment Gateway',
        type: 'payment_gateway',
        status: 'connected',
        latencyMs: latency,
        message: res.data?.responseMessage || 'Koneksi Duitku normal',
      }
    } catch (err: any) {
      const latency = Date.now() - start
      return {
        id: 'duitku',
        name: 'Duitku Payment Gateway',
        type: 'payment_gateway',
        status: 'error',
        latencyMs: latency,
        message:
          err?.response?.data?.responseMessage || err?.message || 'Gagal terhubung ke Duitku',
      }
    }
  }

  /**
   * Test Koneksi Digiflazz H2H
   */
  public static async testDigiflazz(): Promise<GatewayTestResult> {
    const username = env.get('DIGIFLAZZ_USERNAME')
    const apiKey = env.get('DIGIFLAZZ_API_KEY')

    if (!username || !apiKey) {
      return {
        id: 'digiflazz',
        name: 'Digiflazz H2H Provider',
        type: 'h2h_provider',
        status: 'not_configured',
        latencyMs: 0,
        message: 'DIGIFLAZZ_USERNAME atau DIGIFLAZZ_API_KEY belum diisi di .env',
      }
    }

    const start = Date.now()
    try {
      const digiflazz = new DigiflazzService(axios)
      const res = await digiflazz.checkSaldo()
      const latency = Date.now() - start
      return {
        id: 'digiflazz',
        name: 'Digiflazz H2H Provider',
        type: 'h2h_provider',
        status: 'connected',
        latencyMs: latency,
        balance: res.saldo,
        message: `Terkoneksi normal (Saldo: Rp ${Number(res.saldo).toLocaleString('id-ID')})`,
        details: {
          username,
          ip_vps: '84.247.148.122',
        },
      }
    } catch (err: any) {
      const latency = Date.now() - start
      return {
        id: 'digiflazz',
        name: 'Digiflazz H2H Provider',
        type: 'h2h_provider',
        status: 'error',
        latencyMs: latency,
        message: err?.message || 'Gagal terhubung ke Digiflazz (Cek IP Whitelist / Key)',
      }
    }
  }

  /**
   * Test Koneksi VIP-Reseller H2H
   */
  public static async testVipReseller(): Promise<GatewayTestResult> {
    const apiId = env.get('VIP_RESELLER_API_ID')
    const apiKey = env.get('VIP_RESELLER_API_KEY')

    if (!apiId || !apiKey) {
      return {
        id: 'vipreseller',
        name: 'VIP-Reseller H2H Provider',
        type: 'h2h_provider',
        status: 'not_configured',
        latencyMs: 0,
        message: 'VIP_RESELLER_API_ID atau VIP_RESELLER_API_KEY belum diisi di .env',
      }
    }

    const start = Date.now()
    try {
      const vip = new VipResellerService()
      const res = await vip.checkSaldo()
      const latency = Date.now() - start
      return {
        id: 'vipreseller',
        name: 'VIP-Reseller H2H Provider',
        type: 'h2h_provider',
        status: 'connected',
        latencyMs: latency,
        balance: res.balance,
        message: `Terkoneksi normal (Saldo: Rp ${Number(res.balance).toLocaleString('id-ID')} | Level: ${res.level})`,
        details: {
          username: res.username,
          level: res.level,
          point: res.point,
        },
      }
    } catch (err: any) {
      const latency = Date.now() - start
      return {
        id: 'vipreseller',
        name: 'VIP-Reseller H2H Provider',
        type: 'h2h_provider',
        status: 'error',
        latencyMs: latency,
        message: err?.message || 'Gagal terhubung ke VIP-Reseller',
      }
    }
  }

  /**
   * Test Semua Gateway dan H2H Provider Secara Paralel
   */
  public static async testAll(): Promise<GatewayTestResult[]> {
    const results = await Promise.all([
      GatewayTesterService.testKlikQris(),
      GatewayTesterService.testTripay(),
      GatewayTesterService.testDuitku(),
      GatewayTesterService.testDigiflazz(),
      GatewayTesterService.testVipReseller(),
    ])
    return results
  }
}
