import { HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { type AxiosInstance, isAxiosError } from 'axios'
import { ApiServiceException } from 'src/common/exceptions/api-service.exception'
import type {
  KlikQrisApiResponse,
  KlikQrisCreatePayload,
  KlikQrisCreateResponseData,
} from './klikqris.type'

@Injectable()
export class KlikQrisApiService {
  private readonly BASE_URL: string
  private readonly API_KEY: string
  private readonly MERCHANT_ID: string
  private readonly API_CLIENT: AxiosInstance

  constructor(private readonly configService: ConfigService) {
    this.BASE_URL =
      this.configService.get<string>('KLIKQRIS_BASE_URL') || 'https://klikqris.com/api'
    this.API_KEY = this.configService.get<string>('KLIKQRIS_API_KEY') || ''
    this.MERCHANT_ID = this.configService.get<string>('KLIKQRIS_MERCHANT_ID') || ''

    this.API_CLIENT = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.API_KEY,
        id_merchant: this.MERCHANT_ID,
      },
    })
  }

  public async createQrisTransaction(
    params: KlikQrisCreatePayload,
  ): Promise<KlikQrisCreateResponseData> {
    try {
      const payload = {
        order_id: params.order_id,
        id_merchant: this.MERCHANT_ID,
        amount: Math.round(params.amount),
        keterangan: params.keterangan || `Invoice #${params.order_id}`,
        callback_url: params.callback_url,
      }

      const response = await this.API_CLIENT.post<KlikQrisApiResponse<KlikQrisCreateResponseData>>(
        '/qris/create',
        payload,
      )

      if (!response.data || !response.data.status || !response.data.data) {
        throw new ApiServiceException(
          HttpStatus.BAD_REQUEST,
          response.data?.message || 'Gagal membuat tagihan KlikQRIS',
        )
      }

      return response.data.data
    } catch (error) {
      if (error instanceof ApiServiceException) {
        throw error
      }

      if (isAxiosError(error)) {
        const errorMessage =
          (error.response?.data as { message?: string })?.message ||
          error.message ||
          'KlikQRIS API Error'
        throw new ApiServiceException(
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage,
        )
      }

      throw new ApiServiceException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error when connecting to KlikQRIS API',
      )
    }
  }

  public async checkQrisStatus(orderId: string): Promise<KlikQrisCreateResponseData> {
    try {
      const response = await this.API_CLIENT.get<KlikQrisApiResponse<KlikQrisCreateResponseData>>(
        `/qris/status/${encodeURIComponent(orderId)}`,
      )

      if (!response.data || !response.data.status || !response.data.data) {
        throw new ApiServiceException(
          HttpStatus.BAD_REQUEST,
          response.data?.message || 'Gagal mengecek status KlikQRIS',
        )
      }

      return response.data.data
    } catch (error) {
      if (error instanceof ApiServiceException) {
        throw error
      }

      if (isAxiosError(error)) {
        const errorMessage =
          (error.response?.data as { message?: string })?.message ||
          error.message ||
          'KlikQRIS API Error'
        throw new ApiServiceException(
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessage,
        )
      }

      throw new ApiServiceException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error when checking KlikQRIS status',
      )
    }
  }
}
