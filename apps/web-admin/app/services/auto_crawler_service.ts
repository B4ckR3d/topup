import slugify from '@sindresorhus/slugify'
import { and, eq, ilike } from '@umbreon/db'
import {
  InputFieldType,
  ProductBillingType,
  ProductCategoryType,
  ProductFullfillmentType,
  ProductProvider,
  tb,
} from '@umbreon/db/types'
import axios from 'axios'
import { db } from '#database/db'
import { type DigiflazzProductPrepaid, DigiflazzService } from './digiflazz_service.js'

export interface AutoCrawlOptions {
  categoryFilter?: 'all' | 'games' | 'pulsa' | 'data' | 'e-money' | 'voucher' | 'pln' | string
  brandFilter?: string
  profitStatic?: number
  profitPercentage?: number
  targetCategoryId?: string
}

export interface AutoCrawlSummary {
  success: boolean
  totalFetched: number
  totalProcessed: number
  categoriesCreated: number
  categoriesUpdated: number
  subCategoriesCreated: number
  productsCreated: number
  productsUpdated: number
  brandsProcessed: string[]
  message: string
}

interface CuratedBrandMeta {
  name: string
  slug: string
  type: ProductCategoryType
  publisher: string
  description: string
  imageUrl: string
  bannerUrl: string
  deliveryType: string
  inputFieldIdentifiers: string[]
  defaultSubCategory: string
}

const BRAND_METADATA_MAP: Record<string, CuratedBrandMeta> = {
  'MOBILE LEGENDS': {
    name: 'Mobile Legends: Bang Bang',
    slug: 'mobile-legends',
    type: ProductCategoryType.GAME,
    publisher: 'Moonton',
    description:
      'Top up Diamond Mobile Legends resmi, murah, aman, dan instan 24 jam. Masukkan User ID dan Zone ID.',
    imageUrl:
      'https://shop.ldrescdn.com/rms/ld-space/process/img/f4e8407b5f404dfc9cc1ecf977bd3d571737079825.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['user_id', 'zone_id'],
    defaultSubCategory: 'Diamonds',
  },
  'FREE FIRE': {
    name: 'Free Fire',
    slug: 'free-fire',
    type: ProductCategoryType.GAME,
    publisher: 'Garena',
    description:
      'Top up Diamond Free Fire resmi, murah, dan cepat 24 jam. Cukup masukkan Player ID FF Anda.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227799A_SHELL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['user_id'],
    defaultSubCategory: 'Diamonds',
  },
  'PUBG MOBILE': {
    name: 'PUBG Mobile',
    slug: 'pubg-mobile',
    type: ProductCategoryType.GAME,
    publisher: 'Tencent Games',
    description:
      'Top-up Unknown Cash (UC) untuk PUBG Mobile dengan cepat, murah, dan mudah 24 jam.',
    imageUrl:
      'https://shop.ldrescdn.com/rms/ld-space/process/img/dc2d7c5609bb499385fefb39024d86cf1740989324.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['user_id'],
    defaultSubCategory: 'UC Cash',
  },
  'GENSHIN IMPACT': {
    name: 'Genshin Impact',
    slug: 'genshin-impact',
    type: ProductCategoryType.GAME,
    publisher: 'HoYoverse',
    description: 'Top-up Genesis Crystals & Blessing of the Welkin Moon untuk Genshin Impact.',
    imageUrl:
      'https://shop.ldrescdn.com/rms/ld-space/process/img/8d44ed074f604a88a72c44b81e9be1081741056734.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['user_id', 'server_id'],
    defaultSubCategory: 'Genesis Crystal',
  },
  'HONKAI: STAR RAIL': {
    name: 'Honkai: Star Rail',
    slug: 'honkai-star-rail',
    type: ProductCategoryType.GAME,
    publisher: 'HoYoverse',
    description: 'Top-up Oneiric Shard untuk Honkai: Star Rail dengan cepat, aman, dan instan.',
    imageUrl:
      'https://shop.ldrescdn.com/rms/ld-space/process/img/f4e8407b5f404dfc9cc1ecf977bd3d571737079825.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['user_id', 'server_id'],
    defaultSubCategory: 'Oneiric Shard',
  },
  VALORANT: {
    name: 'Valorant',
    slug: 'valorant',
    type: ProductCategoryType.GAME,
    publisher: 'Riot Games',
    description: 'Beli Valorant Points (VP) resmi langsung masuk ke akun Riot Games Anda.',
    imageUrl:
      'https://shop.ldrescdn.com/rms/ld-space/process/img/3be9b3dc62804b7198494ab6d66637a11737100387.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['riot_id'],
    defaultSubCategory: 'Points (VP)',
  },
  GARENA: {
    name: 'Garena Shells',
    slug: 'garena-shells',
    type: ProductCategoryType.VOUCHER,
    publisher: 'Garena',
    description:
      'Beli Voucher Garena Shells resmi untuk Free Fire, Arena of Valor, Call of Duty Mobile, dan Undawn.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227799A_SHELL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Kode Voucher',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Voucher Shell',
  },
  POKEMON: {
    name: 'Pokémon TCG Pocket',
    slug: 'pokemon-tcg-pocket-gp',
    type: ProductCategoryType.GAME,
    publisher: 'The Pokémon Company',
    description: 'Top-up Poké Gold untuk Pokémon TCG Pocket dengan proses cepat dan mudah.',
    imageUrl:
      'https://shop.ldrescdn.com/rms/ld-space/process/img/93ed92d787fa40c4851dc892687dc9241742369618.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['user_id'],
    defaultSubCategory: 'Poké Gold',
  },
  TELKOMSEL: {
    name: 'Telkomsel',
    slug: 'telkomsel',
    type: ProductCategoryType.PULSA,
    publisher: 'Telkomsel',
    description: 'Top-up pulsa dan paket data Telkomsel cepat, murah, dan langsung masuk 24 jam.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227482MSEL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Pulsa Reguler',
  },
  INDOSAT: {
    name: 'Indosat Ooredoo',
    slug: 'indosat',
    type: ProductCategoryType.PULSA,
    publisher: 'Indosat Ooredoo Hutchison',
    description: 'Top-up pulsa & paket internet Indosat IM3 dengan proses kilat 24 jam.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1746965421AT.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Pulsa Reguler',
  },
  XL: {
    name: 'XL Axiata',
    slug: 'xl',
    type: ProductCategoryType.PULSA,
    publisher: 'XL Axiata',
    description: 'Isi ulang pulsa dan paket data XL dengan harga termurah dan proses otomatis.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227145IATA.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Pulsa Reguler',
  },
  TRI: {
    name: 'Tri',
    slug: 'tri',
    type: ProductCategoryType.PULSA,
    publisher: 'Tri Indonesia',
    description: 'Beli pulsa & kuota Tri hemat dengan proses cepat langsung masuk.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227461.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Pulsa Reguler',
  },
  AXIS: {
    name: 'Axis',
    slug: 'axis',
    type: ProductCategoryType.PULSA,
    publisher: 'Axis',
    description: 'Top-up pulsa dan paket kuota irit Axis dengan transaksi instan 24 jam.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227431.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Pulsa Reguler',
  },
  SMARTFREN: {
    name: 'Smartfren',
    slug: 'smartfren',
    type: ProductCategoryType.PULSA,
    publisher: 'Smartfren',
    description: 'Isi pulsa Smartfren 4G LTE termurah dengan konfirmasi instan.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227504FREN.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Pulsa Reguler',
  },
  PLN: {
    name: 'PLN Token Listrik',
    slug: 'token-pln',
    type: ProductCategoryType.PLN_PREPAID,
    publisher: 'PT PLN (Persero)',
    description:
      'Beli Token Listrik PLN prabayar resmi murah 24 jam. Stroom token dikirimkan otomatis seketika.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227482MSEL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['id_pelanggan_pln'],
    defaultSubCategory: 'Token Listrik',
  },
  DANA: {
    name: 'DANA',
    slug: 'dana',
    type: ProductCategoryType.E_WALLET,
    publisher: 'PT Espay Debit Indonesia Koe',
    description: 'Top-up saldo DANA instan 24 jam tanpa antre. Masukkan nomor HP DANA Anda.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227482MSEL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Saldo DANA',
  },
  GOPAY: {
    name: 'GoPay',
    slug: 'gopay',
    type: ProductCategoryType.E_WALLET,
    publisher: 'GoTo Financial',
    description: 'Isi saldo GoPay customer termurah dan tercepat secara otomatis.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227482MSEL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Saldo GoPay',
  },
  OVO: {
    name: 'OVO',
    slug: 'ovo',
    type: ProductCategoryType.E_WALLET,
    publisher: 'PT Visionet Internasional',
    description: 'Top-up saldo OVO instan 24 jam aman terpercaya.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227482MSEL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Saldo OVO',
  },
  SHOPEEPAY: {
    name: 'ShopeePay',
    slug: 'shopeepay',
    type: ProductCategoryType.E_WALLET,
    publisher: 'Sea Group',
    description: 'Top up ShopeePay langsung cair ke akun Shopee Anda.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227482MSEL.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Otomatis',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Saldo ShopeePay',
  },
  'GOOGLE PLAY': {
    name: 'Google Play Voucher',
    slug: 'google-play-idr',
    type: ProductCategoryType.VOUCHER,
    publisher: 'Google Asia Pacific',
    description: 'Beli Kode Voucher Google Play IDR resmi dengan pengiriman instan.',
    imageUrl:
      'https://sin1.contabostorage.com/b1d79b8bbee7475eab6c15cd3d13cd4d:topupgamestore/p/1754227820E_PLAY_GIFT_CARD.webp',
    bannerUrl:
      'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
    deliveryType: 'Kode Voucher',
    inputFieldIdentifiers: ['nomor_hp'],
    defaultSubCategory: 'Voucher Google Play',
  },
}

export class AutoCrawlerService {
  /**
   * Pastikan Input Field standar tersedia di tabel input_fields
   */
  public static async ensureDefaultInputFields(): Promise<Record<string, string>> {
    const defaultFields = [
      {
        identifier: 'user_id',
        title: 'User ID',
        name: 'User ID / Player ID',
        placeholder: 'Masukkan User ID akun Anda',
        type: InputFieldType.TEXT,
      },
      {
        identifier: 'zone_id',
        title: 'Zone ID',
        name: 'Zone ID / Server ID',
        placeholder: '(1234)',
        type: InputFieldType.TEXT,
      },
      {
        identifier: 'server_id',
        title: 'Server',
        name: 'Server',
        placeholder: 'Pilih Server Akun',
        type: InputFieldType.TEXT,
      },
      {
        identifier: 'nomor_hp',
        title: 'Nomor HP',
        name: 'Nomor WhatsApp / HP',
        placeholder: '08xxxxxxxxxx',
        type: InputFieldType.NUMBER,
      },
      {
        identifier: 'id_pelanggan_pln',
        title: 'ID Pelanggan / No. Meter',
        name: 'No. Meter PLN',
        placeholder: 'Masukkan 11-12 digit No. Meter PLN',
        type: InputFieldType.NUMBER,
      },
      {
        identifier: 'riot_id',
        title: 'Riot ID',
        name: 'Riot ID #Tag',
        placeholder: 'Username#TAG',
        type: InputFieldType.TEXT,
      },
    ]

    const map: Record<string, string> = {}

    for (const item of defaultFields) {
      const existing = await db.query.inputFields.findFirst({
        where: eq(tb.inputFields.identifier, item.identifier),
      })

      if (existing) {
        map[item.identifier] = existing.id
      } else {
        const [created] = await db
          .insert(tb.inputFields)
          .values({
            identifier: item.identifier,
            title: item.title,
            name: item.name,
            placeholder: item.placeholder,
            type: item.type,
            is_required: true,
          })
          .returning()
        map[item.identifier] = created.id
      }
    }

    return map
  }

  /**
   * Hubungkan input fields ke category jika belum terhubung
   */
  public static async connectInputsToCategory(
    categoryId: string,
    identifiers: string[],
    inputMap: Record<string, string>,
  ) {
    for (const ident of identifiers) {
      const fieldId = inputMap[ident]
      if (!fieldId) continue

      const connected = await db.query.inputOnProductCategory.findFirst({
        where: and(
          eq(tb.inputOnProductCategory.product_category_id, categoryId),
          eq(tb.inputOnProductCategory.input_field_id, fieldId),
        ),
      })

      if (!connected) {
        await db.insert(tb.inputOnProductCategory).values({
          product_category_id: categoryId,
          input_field_id: fieldId,
        })
      }
    }
  }

  /**
   * Deteksi metadata kategori berdasarkan brand dan kategori dari Digiflazz
   */
  public static resolveCategoryMeta(brandRaw: string, categoryRaw: string): CuratedBrandMeta {
    const brandUpper = brandRaw.trim().toUpperCase()

    // 1. Cek dari curated mapping
    for (const key of Object.keys(BRAND_METADATA_MAP)) {
      if (brandUpper.includes(key) || key.includes(brandUpper)) {
        return BRAND_METADATA_MAP[key]
      }
    }

    // 2. Fallback cerdas berdasarkan nama & kategori
    const catLower = categoryRaw.toLowerCase()
    let type = ProductCategoryType.GAME
    let defaultSub = 'Reguler'
    let inputFields = ['user_id']
    let deliveryType = 'Otomatis'

    if (catLower.includes('pulsa')) {
      type = ProductCategoryType.PULSA
      defaultSub = 'Pulsa Reguler'
      inputFields = ['nomor_hp']
    } else if (catLower.includes('data') || catLower.includes('kuota')) {
      type = ProductCategoryType.KUOTA
      defaultSub = 'Paket Data'
      inputFields = ['nomor_hp']
    } else if (
      catLower.includes('money') ||
      catLower.includes('wallet') ||
      catLower.includes('ewallet')
    ) {
      type = ProductCategoryType.E_WALLET
      defaultSub = 'Saldo E-Money'
      inputFields = ['nomor_hp']
    } else if (catLower.includes('pln') || brandUpper.includes('PLN')) {
      type = ProductCategoryType.PLN_PREPAID
      defaultSub = 'Token Listrik'
      inputFields = ['id_pelanggan_pln']
    } else if (catLower.includes('voucher')) {
      type = ProductCategoryType.VOUCHER
      defaultSub = 'Voucher'
      inputFields = ['nomor_hp']
      deliveryType = 'Kode Voucher'
    }

    // Format title case brand
    const cleanName = brandRaw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')

    const cleanSlug = slugify(cleanName) || `cat-${Date.now()}`

    return {
      name: cleanName,
      slug: cleanSlug,
      type,
      publisher: cleanName,
      description: `Layanan top up dan beli ${cleanName} cepat, hemat, dan instan 24 jam otomatis.`,
      imageUrl: '/images/default-product.png',
      bannerUrl:
        'https://www.lapakgaming.com/static/banner/lapakgaming/202507/EXP%20LG%20ID-1448x520-HB-Genshin-INEFFA%20CITLALI.png?tr=w-3840%2Cq-75',
      deliveryType,
      inputFieldIdentifiers: inputFields,
      defaultSubCategory: defaultSub,
    }
  }

  /**
   * Eksekusi Auto-Crawl dan Sinkronisasi Katalog Lengkap dari Digiflazz
   */
  public static async executeCrawl(options: AutoCrawlOptions = {}): Promise<AutoCrawlSummary> {
    const {
      categoryFilter = 'all',
      brandFilter,
      profitStatic = 500,
      profitPercentage = 0,
      targetCategoryId,
    } = options

    const digiflazz = new DigiflazzService(axios)
    const digiRes = await digiflazz.getProduct('prepaid')
    const allItems = (digiRes.data as DigiflazzProductPrepaid[]) || []

    if (allItems.length === 0) {
      throw new Error('Tidak ada produk yang diterima dari API Digiflazz')
    }

    // Pastikan master input fields ada
    const inputMap = await AutoCrawlerService.ensureDefaultInputFields()

    // Filter produk sesuai kriteria
    const filteredItems = allItems.filter((item) => {
      // 1. Filter status
      if (!item.brand || !item.product_name) return false

      // 2. Filter Category jika ada
      if (categoryFilter && categoryFilter !== 'all') {
        const itemCat = (item.category || '').toLowerCase()
        const filter = categoryFilter.toLowerCase()

        if (filter === 'games' && !itemCat.includes('game')) return false
        if (filter === 'pulsa' && !itemCat.includes('pulsa')) return false
        if (filter === 'data' && !itemCat.includes('data') && !itemCat.includes('kuota'))
          return false
        if (
          filter === 'e-money' &&
          !itemCat.includes('money') &&
          !itemCat.includes('wallet') &&
          !itemCat.includes('ewallet')
        )
          return false
        if (filter === 'pln' && !itemCat.includes('pln') && !(item.brand || '').includes('PLN'))
          return false
        if (filter === 'voucher' && !itemCat.includes('voucher')) return false
      }

      // 3. Filter Brand jika ada
      if (brandFilter) {
        const itemBrand = (item.brand || '').toLowerCase()
        const targetBrand = brandFilter.toLowerCase()
        if (!itemBrand.includes(targetBrand) && !targetBrand.includes(itemBrand)) {
          return false
        }
      }

      return true
    })

    // Kelompokkan produk berdasarkan brand
    const brandGroups: Record<string, DigiflazzProductPrepaid[]> = {}
    for (const item of filteredItems) {
      const brandKey = item.brand.trim()
      if (!brandGroups[brandKey]) {
        brandGroups[brandKey] = []
      }
      brandGroups[brandKey].push(item)
    }

    let categoriesCreated = 0
    let categoriesUpdated = 0
    let subCategoriesCreated = 0
    let productsCreated = 0
    let productsUpdated = 0
    const processedBrands: string[] = []

    // Jalankan sinkronisasi per Brand
    for (const [brandName, products] of Object.entries(brandGroups)) {
      processedBrands.push(brandName)
      const firstItem = products[0]
      const meta = AutoCrawlerService.resolveCategoryMeta(brandName, firstItem.category || '')

      // 1. Cari atau buat Category
      let categoryRecord = null

      if (targetCategoryId) {
        categoryRecord = await db.query.productCategories.findFirst({
          where: eq(tb.productCategories.id, targetCategoryId),
        })
      }

      if (!categoryRecord) {
        // Cari berdasarkan slug atau nama
        categoryRecord = await db.query.productCategories.findFirst({
          where: eq(tb.productCategories.slug, meta.slug),
        })
      }

      if (!categoryRecord) {
        // Cari kemiripan nama
        categoryRecord = await db.query.productCategories.findFirst({
          where: ilike(tb.productCategories.name, `%${brandName}%`),
        })
      }

      if (!categoryRecord) {
        // Buat Kategori Baru
        const [newCat] = await db
          .insert(tb.productCategories)
          .values({
            name: meta.name,
            slug: meta.slug,
            sub_name: firstItem.category || null,
            description: meta.description,
            image_url: meta.imageUrl,
            banner_url: meta.bannerUrl,
            publisher: meta.publisher,
            delivery_type: meta.deliveryType,
            type: meta.type,
            product_billing_type: ProductBillingType.PREPAID,
            product_fullfillment_type: ProductFullfillmentType.AUTOMATIC_DIRECT,
            is_available: true,
            is_featured: false,
            tags1: [firstItem.category || 'H2H', 'Otomatis'],
            tags2: ['Digiflazz', brandName],
          })
          .returning()
        categoryRecord = newCat
        categoriesCreated++
      } else {
        categoriesUpdated++
      }

      // Hubungkan input field ke category jika belum
      await AutoCrawlerService.connectInputsToCategory(
        categoryRecord.id,
        meta.inputFieldIdentifiers,
        inputMap,
      )

      // 2. Kelompokkan produk ke dalam Sub-Categories
      // Bisa berdasarkan field `type` Digiflazz atau nama default
      const subCatGroups: Record<string, DigiflazzProductPrepaid[]> = {}
      for (const prod of products) {
        let subName = prod.type?.trim()
        if (!subName || subName.toLowerCase() === 'umum' || subName.length < 2) {
          subName = meta.defaultSubCategory
        }
        if (!subCatGroups[subName]) {
          subCatGroups[subName] = []
        }
        subCatGroups[subName].push(prod)
      }

      for (const [subName, subProducts] of Object.entries(subCatGroups)) {
        // Cari atau buat Sub-Category
        let subRecord = await db.query.productSubCategories.findFirst({
          where: and(
            eq(tb.productSubCategories.product_category_id, categoryRecord.id),
            eq(tb.productSubCategories.name, subName),
          ),
        })

        if (!subRecord) {
          // Cari jika ada sub-kategori apa pun di kategori ini
          const existingSubs = await db.query.productSubCategories.findMany({
            where: eq(tb.productSubCategories.product_category_id, categoryRecord.id),
          })

          if (existingSubs.length === 1) {
            subRecord = existingSubs[0]
          } else {
            const [newSub] = await db
              .insert(tb.productSubCategories)
              .values({
                product_category_id: categoryRecord.id,
                name: subName,
                sub_name: 'Proses Otomatis 24 Jam',
                description: `Katalog ${subName} untuk ${categoryRecord.name}`,
                image_url: categoryRecord.image_url,
                is_available: true,
                is_featured: false,
              })
              .returning()
            subRecord = newSub
            subCategoriesCreated++
          }
        }

        // 3. Masukkan atau Perbarui Produk ke dalam Sub-Category
        for (const item of subProducts) {
          const providerPrice = Math.round(Number(item.price) || 0)
          const profit = Number(profitStatic) + (providerPrice * Number(profitPercentage)) / 100
          const retailPrice = Math.round(providerPrice + profit)
          const isItemAvailable =
            Boolean(item.buyer_product_status) && Boolean(item.seller_product_status)
          const stockValue = item.unlimited_stock ? 9999 : Number(item.stock) || 100

          const existingProduct = await db.query.products.findFirst({
            where: and(
              eq(tb.products.provider_code, item.buyer_sku_code),
              eq(tb.products.provider_name, ProductProvider.DIGIFLAZZ),
            ),
          })

          if (existingProduct) {
            // Update harga & stok
            await db
              .update(tb.products)
              .set({
                provider_price: providerPrice,
                provider_max_price: providerPrice,
                price: retailPrice,
                stock: stockValue,
                is_available: isItemAvailable,
                notes: item.desc || existingProduct.notes,
                updated_at: new Date(),
              })
              .where(eq(tb.products.id, existingProduct.id))
            productsUpdated++
          } else {
            // Insert produk baru
            const skuSanitized = item.buyer_sku_code
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(0, 15)
              .toUpperCase()

            await db.insert(tb.products).values({
              product_sub_category_id: subRecord.id,
              name: item.product_name,
              sub_name: item.brand,
              description: item.desc || null,
              sku_code: skuSanitized,
              provider_code: item.buyer_sku_code,
              provider_name: ProductProvider.DIGIFLAZZ,
              provider_price: providerPrice,
              provider_max_price: providerPrice,
              price: retailPrice,
              profit_static: Number(profitStatic),
              profit_percentage: Number(profitPercentage),
              stock: stockValue,
              is_available: isItemAvailable,
              is_featured: false,
              image_url: subRecord.image_url || categoryRecord.image_url,
              notes: item.desc || null,
            })
            productsCreated++
          }
        }
      }
    }

    return {
      success: true,
      totalFetched: allItems.length,
      totalProcessed: filteredItems.length,
      categoriesCreated,
      categoriesUpdated,
      subCategoriesCreated,
      productsCreated,
      productsUpdated,
      brandsProcessed: processedBrands,
      message: `Auto-Crawl Digiflazz Selesai! ${productsCreated} produk baru dibuat, ${productsUpdated} diperbarui pada ${processedBrands.length} brand.`,
    }
  }

  /**
   * Ambil daftar brand unik yang tersedia di Digiflazz beserta jumlah SKU-nya
   */
  public static async getAvailableBrands(categoryFilter?: string) {
    const digiflazz = new DigiflazzService(axios)
    const digiRes = await digiflazz.getProduct('prepaid')
    const allItems = (digiRes.data as DigiflazzProductPrepaid[]) || []

    const brandCounts: Record<string, { brand: string; category: string; count: number }> = {}

    for (const item of allItems) {
      if (!item.brand) continue
      if (categoryFilter && categoryFilter !== 'all') {
        const itemCat = (item.category || '').toLowerCase()
        if (!itemCat.includes(categoryFilter.toLowerCase())) continue
      }

      const key = item.brand.trim()
      if (!brandCounts[key]) {
        brandCounts[key] = {
          brand: key,
          category: item.category || 'Umum',
          count: 0,
        }
      }
      brandCounts[key].count++
    }

    return Object.values(brandCounts).sort((a, b) => b.count - a.count)
  }
}
