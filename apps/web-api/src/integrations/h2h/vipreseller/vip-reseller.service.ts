import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { type AxiosInstance } from 'axios'
import type {
  VipResellerGameService,
  VipResellerNicknameResponse,
  VipResellerOrderResponse,
  VipResellerPrepaidService,
  VipResellerProfileResponse,
} from './vip-reseller.type'

@Injectable()
export class VipResellerService {
  private readonly logger = new Logger(VipResellerService.name)
  private readonly baseUrl: string
  private readonly apiId: string
  private readonly apiKey: string
  private readonly client: AxiosInstance

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('VIP_RESELLER_BASE_URL') || 'https://vip-reseller.co.id/api'
    this.apiId = this.configService.get<string>('VIP_RESELLER_API_ID') || ''
    this.apiKey = this.configService.get<string>('VIP_RESELLER_API_KEY') || ''

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    })
  }

  public getSignature(): string {
    return crypto.createHash('md5').update(`${this.apiId}${this.apiKey}`).digest('hex')
  }

  /**
   * Cek Profile & Saldo VIP-Reseller
   */
  public async checkProfile(): Promise<VipResellerProfileResponse> {
    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        sign: this.getSignature(),
      })

      const res = await this.client.post<VipResellerProfileResponse>('/profile', params.toString())
      return res.data
    } catch (err: any) {
      this.logger.error(`[VIP-Reseller Profile Error]: ${err?.message || err}`)
      throw new Error(
        err?.response?.data?.message || err?.message || 'Gagal terhubung ke VIP-Reseller',
      )
    }
  }

  /**
   * Mengambil Katalog Produk Prepaid (PPOB, Pulsa, Data, E-Money)
   */
  public async getPrepaidServices(
    filterType?: string,
    filterValue?: string,
  ): Promise<VipResellerPrepaidService[]> {
    try {
      const payload: Record<string, string> = {
        key: this.apiKey,
        sign: this.getSignature(),
        type: 'services',
      }
      if (filterType) payload.filter_type = filterType
      if (filterValue) payload.filter_value = filterValue

      const params = new URLSearchParams(payload)
      const res = await this.client.post<{
        result: boolean
        data?: VipResellerPrepaidService[]
        message: string
      }>('/prepaid', params.toString())

      return res.data?.data || []
    } catch (err: any) {
      this.logger.error(`[VIP-Reseller Prepaid Services Error]: ${err?.message || err}`)
      throw new Error(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal mengambil layanan prepaid VIP-Reseller',
      )
    }
  }

  /**
   * Mengambil Katalog Produk Game Feature (MLBB, FF, dll)
   */
  public async getGameServices(
    filterGame?: string,
    filterStatus = 'available',
  ): Promise<VipResellerGameService[]> {
    try {
      const payload: Record<string, string> = {
        key: this.apiKey,
        sign: this.getSignature(),
        type: 'services',
      }
      if (filterGame) payload.filter_game = filterGame
      if (filterStatus) payload.filter_status = filterStatus

      const params = new URLSearchParams(payload)
      const res = await this.client.post<{
        result: boolean
        data?: VipResellerGameService[]
        message: string
      }>('/game-feature', params.toString())

      return res.data?.data || []
    } catch (err: any) {
      this.logger.error(`[VIP-Reseller Game Services Error]: ${err?.message || err}`)
      throw new Error(
        err?.response?.data?.message || err?.message || 'Gagal mengambil layanan game VIP-Reseller',
      )
    }
  }

  /**
   * Cek Nickname Game Live (MLBB, Free Fire, dll)
   */
  public async checkGameNickname(
    gameCode: string,
    target: string,
    additionalTarget?: string,
  ): Promise<VipResellerNicknameResponse> {
    try {
      const payload: Record<string, string> = {
        key: this.apiKey,
        sign: this.getSignature(),
        type: 'get-nickname',
        code: gameCode,
        target: target,
      }
      if (additionalTarget) {
        payload.additional_target = additionalTarget
      }

      const params = new URLSearchParams(payload)
      const res = await this.client.post<VipResellerNicknameResponse>(
        '/game-feature',
        params.toString(),
      )
      return res.data
    } catch (err: any) {
      this.logger.error(`[VIP-Reseller Nickname Error]: ${err?.message || err}`)
      return {
        result: false,
        message: err?.response?.data?.message || err?.message || 'Gagal memeriksa nickname ID game',
      }
    }
  }

  /**
   * Order Top Up Game Feature
   */
  public async orderGame(
    serviceCode: string,
    targetId: string,
    zoneId?: string,
    additionalData?: string,
  ): Promise<VipResellerOrderResponse> {
    try {
      const payload: Record<string, string> = {
        key: this.apiKey,
        sign: this.getSignature(),
        type: 'order',
        service: serviceCode,
        data_no: targetId,
      }
      if (zoneId) payload.data_zone = zoneId
      if (additionalData) payload.post_additional_data = additionalData

      const params = new URLSearchParams(payload)
      const res = await this.client.post<VipResellerOrderResponse>(
        '/game-feature',
        params.toString(),
      )
      return res.data
    } catch (err: any) {
      this.logger.error(`[VIP-Reseller Order Game Error]: ${err?.message || err}`)
      throw new Error(
        err?.response?.data?.message || err?.message || 'Gagal melakukan order game VIP-Reseller',
      )
    }
  }

  /**
   * Order Prepaid (PPOB / Pulsa / Data)
   */
  public async orderPrepaid(
    serviceCode: string,
    targetPhone: string,
  ): Promise<VipResellerOrderResponse> {
    try {
      const payload: Record<string, string> = {
        key: this.apiKey,
        sign: this.getSignature(),
        type: 'order',
        service: serviceCode,
        data_no: targetPhone,
      }

      const params = new URLSearchParams(payload)
      const res = await this.client.post<VipResellerOrderResponse>('/prepaid', params.toString())
      return res.data
    } catch (err: any) {
      this.logger.error(`[VIP-Reseller Order Prepaid Error]: ${err?.message || err}`)
      throw new Error(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal melakukan order prepaid VIP-Reseller',
      )
    }
  }
}
