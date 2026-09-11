import cache from '@adonisjs/cache/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import axios from 'axios'
import { AutoCrawlerService } from '#services/auto_crawler_service'
import { DigiflazzService } from '#services/digiflazz_service'
import { GatewayTesterService } from '#services/gateway_tester_service'
import { VipResellerService } from '#services/vip_reseller_service'

const digiflazzQueryValidator = vine.object({
  billingType: vine.enum(['prepaid', 'postpaid']).optional(),
  category: vine.string().optional(),
  brand: vine.string().optional(),
  type: vine.string().optional(),
})

const autoCrawlValidator = vine.object({
  categoryFilter: vine.string().optional(),
  brandFilter: vine.string().optional(),
  profitStatic: vine.number().min(0).optional(),
  profitPercentage: vine.number().min(0).max(100).optional(),
  targetCategoryId: vine.string().uuid().optional(),
})

const vipResellerQueryValidator = vine.object({
  serviceType: vine.enum(['prepaid', 'game', 'all']).optional(),
})

export default class ProvidersController {
  // Digiflazz Auto-Crawl & Sync
  async digiflazzAutoCrawl(ctx: HttpContext) {
    try {
      const payload = await ctx.request.validateUsing(vine.compile(autoCrawlValidator), {
        data: ctx.request.body(),
      })

      const summary = await AutoCrawlerService.executeCrawl({
        categoryFilter: payload.categoryFilter,
        brandFilter: payload.brandFilter,
        profitStatic: payload.profitStatic ?? 500,
        profitPercentage: payload.profitPercentage ?? 0,
        targetCategoryId: payload.targetCategoryId,
      })

      return ctx.response.json(summary)
    } catch (err: any) {
      console.error('[ProvidersController] digiflazzAutoCrawl error:', err)
      return ctx.response.status(400).json({
        success: false,
        error: err?.message || 'Gagal melakukan auto-crawl dari Digiflazz',
      })
    }
  }

  // Digiflazz Available Brands
  async digiflazzBrands(ctx: HttpContext) {
    try {
      const categoryFilter = ctx.request.input('categoryFilter')
      const brands = await AutoCrawlerService.getAvailableBrands(categoryFilter)
      return ctx.response.json({
        success: true,
        brands,
      })
    } catch (err: any) {
      console.error('[ProvidersController] digiflazzBrands error:', err)
      return ctx.response.status(400).json({
        success: false,
        error: err?.message || 'Gagal mengambil daftar brand dari Digiflazz',
        brands: [],
      })
    }
  }
  // Digiflazz Products
  async digiflazzProducts(ctx: HttpContext) {
    const query = await ctx.request.validateUsing(vine.compile(digiflazzQueryValidator), {
      data: ctx.request.qs(),
    })

    const cacheKey = `digiflazz:${query.billingType ?? 'prepaid'}`
    const cached = await cache.get<unknown[]>({ key: cacheKey })

    if (cached) {
      return ctx.response.json({ data: cached })
    }

    const digiflazz = new DigiflazzService(axios)
    const response = await digiflazz.getProduct(query.billingType ?? 'prepaid')
    const data = response.data ?? []

    await cache.set({ key: cacheKey, value: data, ttl: '3m' })

    return ctx.response.json({
      data,
    })
  }

  // Digiflazz Saldo
  async digiflazzSaldo(ctx: HttpContext) {
    try {
      const digiflazz = new DigiflazzService(axios)
      const res = await digiflazz.checkSaldo()
      return ctx.response.json({
        success: true,
        connected: true,
        saldo: res.saldo,
        message: 'Koneksi Digiflazz Normal',
      })
    } catch (err: any) {
      console.error('[ProvidersController] Digiflazz checkSaldo error:', err)
      return ctx.response.status(400).json({
        success: false,
        connected: false,
        error: err?.message || 'Gagal terhubung ke API Digiflazz',
      })
    }
  }

  // VIP-Reseller Saldo
  async vipResellerSaldo(ctx: HttpContext) {
    try {
      const vip = new VipResellerService()
      const res = await vip.checkSaldo()
      return ctx.response.json({
        success: true,
        connected: true,
        balance: res.balance,
        point: res.point,
        level: res.level,
        username: res.username,
        latency: res.latency,
        message: res.message,
      })
    } catch (err: any) {
      console.error('[ProvidersController] VIP-Reseller checkSaldo error:', err)
      return ctx.response.status(400).json({
        success: false,
        connected: false,
        error: err?.message || 'Gagal terhubung ke API VIP-Reseller',
      })
    }
  }

  // VIP-Reseller Products
  async vipResellerProducts(ctx: HttpContext) {
    const query = await ctx.request.validateUsing(vine.compile(vipResellerQueryValidator), {
      data: ctx.request.qs(),
    })

    const cacheKey = `vipreseller:${query.serviceType ?? 'all'}`
    const cached = await cache.get<unknown[]>({ key: cacheKey })

    if (cached) {
      return ctx.response.json({ data: cached })
    }

    try {
      const vip = new VipResellerService()
      const data = await vip.getProducts(query.serviceType ?? 'all')

      await cache.set({ key: cacheKey, value: data, ttl: '3m' })

      return ctx.response.json({
        data,
      })
    } catch (err: any) {
      console.error('[ProvidersController] VIP-Reseller getProducts error:', err)
      return ctx.response.status(400).json({
        error: err?.message || 'Gagal mengambil data produk dari VIP-Reseller',
        data: [],
      })
    }
  }

  // Test Semua Gateway & H2H Provider Sekaligus
  async testAllGateways(ctx: HttpContext) {
    try {
      const results = await GatewayTesterService.testAll()
      return ctx.response.json({
        success: true,
        timestamp: new Date().toISOString(),
        gateways: results,
      })
    } catch (err: any) {
      return ctx.response.status(500).json({
        success: false,
        error: err?.message || 'Gagal melakukan pengujian gateway',
      })
    }
  }

  // Test Single Gateway
  async testSingleGateway(ctx: HttpContext) {
    const id = ctx.params.gateway
    let result = null

    switch (id) {
      case 'klikqris':
        result = await GatewayTesterService.testKlikQris()
        break
      case 'tripay':
        result = await GatewayTesterService.testTripay()
        break
      case 'duitku':
        result = await GatewayTesterService.testDuitku()
        break
      case 'digiflazz':
        result = await GatewayTesterService.testDigiflazz()
        break
      case 'vipreseller':
        result = await GatewayTesterService.testVipReseller()
        break
      default:
        return ctx.response.status(400).json({ error: 'Gateway tidak dikenali' })
    }

    return ctx.response.json(result)
  }
}
