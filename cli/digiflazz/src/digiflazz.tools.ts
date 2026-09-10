import { isAxiosError } from 'axios'
import { DigiflazzService } from './digiflazz.service'
import type { Cookie, Product, ProductCategory, Seller } from './digiflazz.type'

export type UpdateMode = 'seller' | 'price-only'

export type AutoFillProductCodeConfig =
  | boolean
  | {
      enabled: boolean
      prefix?: string
      length?: number
    }

export type MaxPriceConfig = {
  mode: 'same' | 'markup'
  markup: {
    amount: number
    perCode: Record<string, number>
  }
}

export type PerProductConfig = {
  updateMode?: UpdateMode
  preferredSellers?: string[]
  allowedSellerSkuCodes?: string[]
}

export type SellerFilterConfig = {
  minRating: number
  minRatingSteps?: number[]
  blacklist: string[]
  requireActive: boolean
  enforceMaxPrice: boolean
}

export type SellerPriorityRule = {
  seller?: string[]
  blacklist?: string[]
}

export type SellerPriorityPriceGapRule = {
  enabled?: boolean
  allowCheapestNonListFallback?: boolean
  maxPriceGap: number
  minRating: number
  minBuyerCount: number
}

export type SellerPriorityConfig = {
  global?: SellerPriorityRule
  perBrand?: Record<string, SellerPriorityRule>
  perSubBrand?: Record<string, SellerPriorityRule>
  listPriceGapRule?: SellerPriorityPriceGapRule
}

type SelectedPriorityScope = 'product' | 'sub-brand' | 'brand' | 'global'

type BestSellerSelection = {
  seller: Seller
  source: 'priority-list' | 'priority-overridden' | 'fallback'
  priorityScope?: SelectedPriorityScope
  overriddenPrioritySeller?: string
  priceGap?: number
}

export type DigiflazzUpdateConfig = {
  cookies: Cookie[]
  categories?: string[]
  subCategoryTypeIds?: string[]
  excludeProductCodes?: string[]
  updateMode?: UpdateMode
  perProduct?: Record<string, PerProductConfig>
  autoFillProductCode?: AutoFillProductCodeConfig
  maxPrice?: MaxPriceConfig
  onlyProblematic?: boolean
  problematicCriteria?: {
    inactiveSeller: boolean
    priceOverMax: boolean
  }
  sellerFilter?: SellerFilterConfig
  sellerPriority?: SellerPriorityConfig
  requestDelayMs?: number
  logger?: Partial<UpdateLogger>
}

export type UpdateLogger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  success: (message: string) => void
  muted: (message: string) => void
}

export type UpdateErrorDetail = {
  message: string
  status?: number
  data?: unknown
}

export type UpdateReportItem = {
  productId: string
  productName: string
  previousSeller?: string
  previousPrice?: number
  nextSeller?: string
  nextPrice?: number
  maxPriceBefore?: number
  maxPriceAfter?: number
  codeBefore?: string
  codeAfter?: string
  status: 'updated' | 'skipped' | 'error'
  reason?: string
}

export type BrandUpdateReport = {
  categoryId: string
  categoryName: string
  brandId: string
  brandName: string
  selectors: {
    categories: string[]
    subcategories: string[]
  }
  stats: {
    totalProducts: number
    problematic: number
    updated: number
    skippedNotProblematic: number
    skippedNoSeller: number
  }
  items: UpdateReportItem[]
  errors: UpdateErrorDetail[]
  updateMessage?: string
  failedSample?: Array<{
    productId: string
    code: string
    price: number
    max_price: number
    seller: string
    seller_sku_id: string
  }>
  updatedAt: string
}

const defaultLogger: UpdateLogger = {
  info: (message) => console.log(`[info] ${message}`),
  warn: (message) => console.log(`[warn] ${message}`),
  error: (message) => console.log(`[error] ${message}`),
  success: (message) => console.log(`[ok] ${message}`),
  muted: (message) => console.log(`[...] ${message}`),
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const matchesSelector = (selectors: string[], value: string, name?: string) => {
  if (selectors.length === 0 || selectors.includes('all')) {
    return true
  }

  const normalized = selectors.map((selector) => selector.toLowerCase())
  const valueMatch = normalized.includes(value.toLowerCase())
  const nameMatch = name ? normalized.includes(name.toLowerCase()) : false
  return valueMatch || nameMatch
}

const extractErrorDetail = (error: unknown): UpdateErrorDetail => {
  if (isAxiosError(error)) {
    return {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    }
  }

  if (error instanceof Error) {
    return { message: error.message }
  }

  return { message: String(error) }
}

const extractErrorMessages = (detail: UpdateErrorDetail) => {
  const data = detail.data
  if (!data || typeof data !== 'object') {
    return []
  }

  const errors = (data as { errors?: unknown }).errors
  if (Array.isArray(errors)) {
    return errors.filter((item) => typeof item === 'string') as string[]
  }

  return []
}

const normalizeConfigKey = (value: string) => value.toLowerCase()

const normalizeMatchKey = (value: string) => normalizeConfigKey(value).trim()

const toComparableKeys = (value: string) => {
  const normalized = normalizeMatchKey(value)
  if (!normalized) {
    return []
  }

  const keys = new Set<string>([normalized])
  if (normalized.endsWith('s') && normalized.length > 1) {
    keys.add(normalized.slice(0, -1))
  }
  return [...keys]
}

const buildPerProductConfigMap = (perProduct: Record<string, PerProductConfig>) => {
  const entries = Object.entries(perProduct)
  return new Map(entries.map(([key, value]) => [normalizeConfigKey(key), value]))
}

const getPerProductConfig = (map: Map<string, PerProductConfig>, product: ProductCategory) => {
  const codeKey = product.code ? normalizeConfigKey(product.code) : ''
  return codeKey ? map.get(codeKey) : undefined
}

const isProblematic = (
  product: ProductCategory,
  onlyProblematic: boolean,
  criteria: { inactiveSeller: boolean; priceOverMax: boolean },
) => {
  if (!onlyProblematic) {
    return true
  }

  const checks: boolean[] = []

  if (criteria.inactiveSeller) {
    checks.push(!product.status || product.status_sellerSku < 0)
  }

  if (criteria.priceOverMax) {
    checks.push(product.price > product.max_price)
  }

  return checks.some(Boolean)
}

const isSellerAllowed = (
  seller: Seller,
  product: ProductCategory,
  minRating: number,
  filter: SellerFilterConfig,
  blockedSellers: Set<string>,
) => {
  if (filter.requireActive && (!seller.status || seller.status_sellerSku === 0)) {
    return false
  }

  if (minRating > 0 && seller.reviewAvg < minRating) {
    return false
  }

  if (blockedSellers.has(normalizeSellerName(seller.seller))) {
    return false
  }

  if (filter.enforceMaxPrice && seller.price > product.max_price) {
    return false
  }

  return true
}

const normalizeNames = (names?: string[]) =>
  (names ?? []).map((name) => name.trim().toLowerCase()).filter(Boolean)

const normalizeSellerName = (name: string) => name.trim().toLowerCase()

const getSellerPriorityRuleForBrand = (
  sellerPriority: SellerPriorityConfig,
  brandId: string,
  brandName: string,
  categoryId: string,
  categoryName: string,
) => {
  const perBrand = sellerPriority.perBrand ?? {}
  const comparableTargets = new Set<string>([
    ...toComparableKeys(brandId),
    ...toComparableKeys(brandName),
    ...toComparableKeys(categoryId),
    ...toComparableKeys(categoryName),
  ])

  for (const [key, rule] of Object.entries(perBrand)) {
    const keyVariants = toComparableKeys(key)
    if (keyVariants.some((candidate) => comparableTargets.has(candidate))) {
      return rule
    }
  }

  return undefined
}

const getSellerPriorityRuleForSubBrand = (
  sellerPriority: SellerPriorityConfig,
  subBrandId: string,
  subBrandName: string,
) => {
  const perSubBrand = sellerPriority.perSubBrand ?? {}
  const normalizedSubBrandId = normalizeConfigKey(subBrandId)
  const normalizedSubBrandName = normalizeConfigKey(subBrandName)

  for (const [key, rule] of Object.entries(perSubBrand)) {
    const normalizedKey = normalizeConfigKey(key)
    if (normalizedKey === normalizedSubBrandId || normalizedKey === normalizedSubBrandName) {
      return rule
    }
  }

  return undefined
}

const buildBlockedSellers = (
  filter: SellerFilterConfig,
  sellerPriority: SellerPriorityConfig,
  brandRule?: SellerPriorityRule,
  subBrandRule?: SellerPriorityRule,
) => {
  const globalBlocked = normalizeNames([
    ...filter.blacklist,
    ...(sellerPriority.global?.blacklist ?? []),
  ])
  const brandBlocked = normalizeNames(brandRule?.blacklist)
  const subBrandBlocked = normalizeNames(subBrandRule?.blacklist)
  const brandAllowed = new Set(normalizeNames(brandRule?.seller))
  const subBrandAllowed = new Set(normalizeNames(subBrandRule?.seller))

  return new Set(
    [...globalBlocked, ...brandBlocked, ...subBrandBlocked].filter((name) => {
      // Brand/sub-brand level seller priority can explicitly allow names blocked globally.
      if (brandAllowed.has(name) || subBrandAllowed.has(name)) {
        return false
      }
      return true
    }),
  )
}

const pickByPriorityNames = (candidates: Seller[], names: string[]) => {
  if (names.length === 0) {
    return null
  }

  const priorityPool = new Set(names)
  const prioritizedCandidates = candidates.filter((seller) =>
    priorityPool.has(normalizeSellerName(seller.seller)),
  )

  if (prioritizedCandidates.length === 0) {
    return null
  }

  return prioritizedCandidates.sort((left, right) => left.price - right.price)[0]
}

const parseRatingCount = (value: string) => {
  const source = value.trim()
  const inParentheses = source.match(/\(([^)]*)\)/)?.[1]?.trim() ?? source

  const lessThanMatch = inParentheses.match(/<\s*(\d+)/)
  if (lessThanMatch) {
    const threshold = Number.parseInt(lessThanMatch[1], 10)
    return Number.isNaN(threshold) ? 0 : Math.max(0, threshold - 1)
  }

  const plusMatch = inParentheses.match(/(\d+)\s*\+/)
  if (plusMatch) {
    const minValue = Number.parseInt(plusMatch[1], 10)
    return Number.isNaN(minValue) ? 0 : minValue
  }

  const exactMatch = inParentheses.match(/(\d+)/)
  if (exactMatch) {
    const exactValue = Number.parseInt(exactMatch[1], 10)
    return Number.isNaN(exactValue) ? 0 : exactValue
  }

  return 0
}

const isBuyerCountEligible = (ratingQty: string, minBuyerCount: number) => {
  const buyerCount = parseRatingCount(ratingQty)
  if (buyerCount > minBuyerCount) {
    return true
  }

  // Example: "5 (10+ rating)" should pass for minBuyerCount=10,
  // while "5 (10 rating)" should not.
  const isPlusFormat = /\(\s*\d+\s*\+/.test(ratingQty)
  return isPlusFormat && buyerCount >= minBuyerCount
}

const pickByPriceGapRule = (
  candidates: Seller[],
  selectedFromPriority: Seller,
  allPriorityNames: Set<string>,
  rule: SellerPriorityPriceGapRule,
) => {
  if (rule.enabled === false || rule.allowCheapestNonListFallback === false) {
    return {
      seller: selectedFromPriority,
      overridden: false,
    }
  }

  const nonPriorityCandidates = candidates.filter((seller) => {
    const isPrioritySeller = allPriorityNames.has(normalizeSellerName(seller.seller))
    if (isPrioritySeller) {
      return false
    }

    if (seller.reviewAvg < rule.minRating) {
      return false
    }

    return isBuyerCountEligible(seller.rating_qty, rule.minBuyerCount)
  })

  if (nonPriorityCandidates.length === 0) {
    return {
      seller: selectedFromPriority,
      overridden: false,
    }
  }

  const cheapestNonPriority = nonPriorityCandidates.sort((left, right) => {
    if (left.price !== right.price) {
      return left.price - right.price
    }

    if (left.reviewAvg !== right.reviewAvg) {
      return right.reviewAvg - left.reviewAvg
    }

    return parseRatingCount(right.rating_qty) - parseRatingCount(left.rating_qty)
  })[0]

  const priceGap = selectedFromPriority.price - cheapestNonPriority.price
  if (priceGap > rule.maxPriceGap) {
    return {
      seller: cheapestNonPriority,
      overridden: true,
      overriddenPrioritySeller: selectedFromPriority.seller,
      priceGap,
    }
  }

  return {
    seller: selectedFromPriority,
    overridden: false,
  }
}

const pickBestSeller = (
  product: ProductCategory,
  sellers: Seller[],
  filter: SellerFilterConfig,
  sellerPriority: SellerPriorityConfig,
  categoryId: string,
  categoryName: string,
  brandId: string,
  brandName: string,
  subBrandId: string,
  subBrandName: string,
  perProduct?: PerProductConfig,
): BestSellerSelection | null => {
  const ratingSteps = filter.minRatingSteps?.length
    ? [...filter.minRatingSteps]
    : [filter.minRating]
  const allowedSku = perProduct?.allowedSellerSkuCodes?.map((code) => code.toLowerCase()) ?? []
  const brandRule = getSellerPriorityRuleForBrand(
    sellerPriority,
    brandId,
    brandName,
    categoryId,
    categoryName,
  )
  const subBrandRule = getSellerPriorityRuleForSubBrand(sellerPriority, subBrandId, subBrandName)
  const blockedSellers = buildBlockedSellers(filter, sellerPriority, brandRule, subBrandRule)
  const globalPriority = normalizeNames(sellerPriority.global?.seller)
  const brandPriority = normalizeNames(brandRule?.seller)
  const subBrandPriority = normalizeNames(subBrandRule?.seller)
  const perProductPriority = normalizeNames(perProduct?.preferredSellers)
  const listPriceGapRule = sellerPriority.listPriceGapRule
  const allowCheapestNonListFallback = listPriceGapRule?.allowCheapestNonListFallback ?? true

  for (const minRating of ratingSteps) {
    const candidates = sellers.filter((seller) => {
      if (allowedSku.length > 0 && !allowedSku.includes(seller.seller_sku_code.toLowerCase())) {
        return false
      }
      return isSellerAllowed(seller, product, minRating, filter, blockedSellers)
    })

    if (candidates.length === 0) {
      continue
    }

    const priorityBuckets: Array<{ names: string[]; scope: SelectedPriorityScope }> = [
      { names: perProductPriority, scope: 'product' },
      { names: subBrandPriority, scope: 'sub-brand' },
      { names: brandPriority, scope: 'brand' },
      { names: globalPriority, scope: 'global' },
    ]
    let selectedFromPriority: Seller | null = null
    let selectedPriorityScope: SelectedPriorityScope | undefined

    for (const bucket of priorityBuckets) {
      selectedFromPriority = pickByPriorityNames(candidates, bucket.names)
      if (selectedFromPriority) {
        selectedPriorityScope = bucket.scope
        break
      }
    }

    if (selectedFromPriority) {
      if (!listPriceGapRule) {
        return {
          seller: selectedFromPriority,
          source: 'priority-list',
          priorityScope: selectedPriorityScope,
        }
      }

      const allPriorityNames = new Set([
        ...perProductPriority,
        ...subBrandPriority,
        ...brandPriority,
        ...globalPriority,
      ])
      const picked = pickByPriceGapRule(
        candidates,
        selectedFromPriority,
        allPriorityNames,
        listPriceGapRule,
      )

      if (picked.overridden) {
        return {
          seller: picked.seller,
          source: 'priority-overridden',
          priorityScope: selectedPriorityScope,
          overriddenPrioritySeller: picked.overriddenPrioritySeller,
          priceGap: picked.priceGap,
        }
      }

      return {
        seller: picked.seller,
        source: 'priority-list',
        priorityScope: selectedPriorityScope,
      }
    }

    if (!allowCheapestNonListFallback) {
      return null
    }

    return {
      seller: candidates.sort((left, right) => left.price - right.price)[0],
      source: 'fallback',
    }
  }

  return null
}

const pickCurrentSeller = (
  product: ProductCategory,
  sellers: Seller[],
  perProduct?: PerProductConfig,
) => {
  const allowedSku = perProduct?.allowedSellerSkuCodes?.map((code) => code.toLowerCase()) ?? []
  const candidates = sellers.filter((seller) => {
    if (allowedSku.length > 0 && !allowedSku.includes(seller.seller_sku_code.toLowerCase())) {
      return false
    }
    return true
  })

  const bySkuCode = candidates.find((seller) => seller.seller_sku_code === product.seller_sku_code)
  if (bySkuCode) {
    return bySkuCode
  }

  const byName = candidates.find((seller) => seller.seller === product.seller)
  if (byName) {
    return byName
  }

  return null
}

const ensureUniqueCode = (code: string, usedCodes: Set<string>) => {
  if (!usedCodes.has(code)) {
    usedCodes.add(code)
    return code
  }

  let candidate = code
  while (usedCodes.has(candidate)) {
    candidate = `${code}-${Math.random().toString(36).slice(2, 8)}`
  }
  usedCodes.add(candidate)
  return candidate
}

const resolveProductCode = (
  product: ProductCategory,
  seller: Seller,
  autoFillConfig: AutoFillProductCodeConfig,
  usedCodes: Set<string>,
) => {
  const autoFillEnabled =
    typeof autoFillConfig === 'boolean' ? autoFillConfig : Boolean(autoFillConfig?.enabled)

  const trimmed = product.code?.trim()
  if (trimmed) {
    return ensureUniqueCode(trimmed, usedCodes)
  }

  if (!autoFillEnabled) {
    return product.code
  }

  if (typeof autoFillConfig === 'object') {
    const prefix = autoFillConfig.prefix ?? 'BP'
    const length = autoFillConfig.length ?? 10
    const randomPart = Math.random().toString(36).slice(2)
    const candidate = `${prefix}${randomPart}`.slice(0, prefix.length + length)
    return ensureUniqueCode(candidate, usedCodes)
  }

  return ensureUniqueCode(seller.seller_sku_code || product.product_id, usedCodes)
}

const getMaxPrice = (price: number, code: string, maxPrice: MaxPriceConfig) => {
  if (maxPrice.mode === 'same') {
    return price
  }

  const perCode = maxPrice.markup.perCode[code]
  const markup = typeof perCode === 'number' ? perCode : maxPrice.markup.amount
  return price + markup
}

const applySellerToProduct = (
  product: ProductCategory,
  seller: Seller,
  autoFillConfig: AutoFillProductCodeConfig,
  maxPrice: MaxPriceConfig,
  usedCodes: Set<string>,
): Product => {
  const updatedCode = resolveProductCode(product, seller, autoFillConfig, usedCodes)
  const updatedMaxPrice = getMaxPrice(seller.price, updatedCode, maxPrice)
  return {
    ...product,
    code: updatedCode,
    max_price: updatedMaxPrice,
    price: seller.price,
    stock: seller.stock,
    start_cut_off: seller.start_cut_off,
    end_cut_off: seller.end_cut_off,
    faktur: seller.faktur,
    multi: seller.multi,
    multi_counter: seller.multi_counter,
    unlimited_stock: seller.unlimited_stock,
    seller: seller.seller,
    seller_sku_id: seller.id,
    seller_sku_id_int: seller.id_int,
    seller_sku_code: seller.seller_sku_code,
    seller_connection_type: seller.connectionType,
    seller_sku_desc: seller.deskripsi,
    status: seller.status,
    status_sellerSku: seller.status_sellerSku,
    isDuplicateCode: false,
    isDuplicateSeller: false,
  }
}

const applyPriceOnlyToProduct = (
  product: ProductCategory,
  seller: Seller,
  autoFillConfig: AutoFillProductCodeConfig,
  maxPrice: MaxPriceConfig,
  usedCodes: Set<string>,
): Product => {
  const updatedCode = resolveProductCode(product, seller, autoFillConfig, usedCodes)
  const updatedMaxPrice = getMaxPrice(seller.price, updatedCode, maxPrice)
  return {
    ...product,
    code: updatedCode,
    max_price: updatedMaxPrice,
    price: seller.price,
    isDuplicateCode: false,
    isDuplicateSeller: false,
  }
}

const normalizeConfig = (config: DigiflazzUpdateConfig) => {
  return {
    categories: config.categories ?? ['all'],
    subCategoryTypeIds: config.subCategoryTypeIds ?? ['all'],
    excludeProductCodes: config.excludeProductCodes ?? [],
    updateMode: config.updateMode ?? 'seller',
    perProduct: config.perProduct ?? {},
    autoFillProductCode: config.autoFillProductCode ?? true,
    maxPrice: config.maxPrice ?? {
      mode: 'markup',
      markup: { amount: 0, perCode: {} },
    },
    onlyProblematic: config.onlyProblematic ?? false,
    problematicCriteria: config.problematicCriteria ?? {
      inactiveSeller: false,
      priceOverMax: false,
    },
    sellerFilter: config.sellerFilter ?? {
      minRating: 0,
      minRatingSteps: [],
      blacklist: [],
      requireActive: true,
      enforceMaxPrice: false,
    },
    sellerPriority: config.sellerPriority ?? {
      global: {
        seller: [],
        blacklist: [],
      },
      perBrand: {},
      perSubBrand: {},
      listPriceGapRule: {
        enabled: true,
        allowCheapestNonListFallback: true,
        maxPriceGap: 1000,
        minRating: 4,
        minBuyerCount: 10,
      },
    },
    requestDelayMs: config.requestDelayMs ?? 1000,
  }
}

export const digiflazzTools = {
  update: async (config: DigiflazzUpdateConfig): Promise<BrandUpdateReport[]> => {
    const logger = { ...defaultLogger, ...config.logger }
    const normalized = normalizeConfig(config)
    const usedCodes = new Set<string>()
    const perProductMap = buildPerProductConfigMap(normalized.perProduct)

    const digiflazz = new DigiflazzService(config.cookies)
    await digiflazz.initialize()

    const categoryResponse = await digiflazz.getProductCategory()
    const brandResponse = await digiflazz.getProductBrand()
    const typeResponse = await digiflazz.getProductType()
    const brandNameById = new Map(brandResponse.data.map((brand) => [brand.id, brand.name]))
    const typeNameById = new Map(typeResponse.data.map((type) => [type.id, type.name]))
    const categories = categoryResponse.data.filter((category) =>
      matchesSelector(normalized.categories, category.id, category.name),
    )

    if (categories.length === 0) {
      logger.warn('No categories matched the selectors.')
      return []
    }

    const reports: BrandUpdateReport[] = []
    const excludedCodes = normalized.excludeProductCodes.map((code) => code.toLowerCase())

    for (const category of categories) {
      logger.info(`Category ${category.name} (${category.id})`)
      try {
        await sleep(normalized.requestDelayMs)
        const detailResponse = await digiflazz.getProductCategoryDetail(category.id)
        const products = detailResponse.data.filter((product) =>
          matchesSelector(
            normalized.subCategoryTypeIds,
            product.product_details.brand.id,
            brandNameById.get(product.product_details.brand.id),
          ),
        )

        const brandsMap = new Map<string, { name: string; items: ProductCategory[] }>()
        for (const product of products) {
          if (product.code && excludedCodes.includes(product.code.toLowerCase())) {
            logger.muted(`Skip excluded product ${product.product} (${product.code})`)
            continue
          }

          const brandId = product.product_details.brand.id
          const brandName = brandNameById.get(brandId) ?? brandId
          if (!brandsMap.has(brandId)) {
            brandsMap.set(brandId, { name: brandName, items: [] })
          }
          brandsMap.get(brandId)?.items.push(product)
        }

        for (const [brandId, brandInfo] of brandsMap.entries()) {
          const report: BrandUpdateReport = {
            categoryId: category.id,
            categoryName: category.name,
            brandId,
            brandName: brandInfo.name,
            selectors: {
              categories: normalized.categories,
              subcategories: normalized.subCategoryTypeIds,
            },
            stats: {
              totalProducts: brandInfo.items.length,
              problematic: 0,
              updated: 0,
              skippedNotProblematic: 0,
              skippedNoSeller: 0,
            },
            items: [],
            errors: [],
            updatedAt: new Date().toISOString(),
          }

          logger.info(`Brand ${brandInfo.name} (${brandId})`)
          const updates: Product[] = []

          for (const product of brandInfo.items) {
            const perProductConfig = getPerProductConfig(perProductMap, product)
            const updateMode = perProductConfig?.updateMode ?? normalized.updateMode

            if (
              !isProblematic(product, normalized.onlyProblematic, normalized.problematicCriteria)
            ) {
              report.stats.skippedNotProblematic += 1
              report.items.push({
                productId: product.product_id,
                productName: product.product,
                previousSeller: product.seller,
                previousPrice: product.price,
                maxPriceBefore: product.max_price,
                maxPriceAfter: product.max_price,
                codeBefore: product.code,
                codeAfter: product.code,
                status: 'skipped',
                reason: 'not-problematic',
              })
              continue
            }

            report.stats.problematic += 1

            try {
              await sleep(normalized.requestDelayMs)
              const sellerResponse = await digiflazz.getProductSeller(product.id)

              if (updateMode === 'price-only') {
                const currentSeller = pickCurrentSeller(
                  product,
                  sellerResponse.data,
                  perProductConfig,
                )
                if (!currentSeller) {
                  report.stats.skippedNoSeller += 1
                  report.errors.push({ message: 'Seller tidak ditemukan' })
                  report.items.push({
                    productId: product.product_id,
                    productName: product.product,
                    previousSeller: product.seller,
                    previousPrice: product.price,
                    maxPriceBefore: product.max_price,
                    maxPriceAfter: product.max_price,
                    codeBefore: product.code,
                    codeAfter: product.code,
                    status: 'skipped',
                    reason: 'price-only-no-current-seller',
                  })
                  logger.warn(
                    `No current seller match for price-only ${product.product} (${product.product_id}).`,
                  )
                  continue
                }

                const updatedProduct = applyPriceOnlyToProduct(
                  product,
                  currentSeller,
                  normalized.autoFillProductCode,
                  normalized.maxPrice,
                  usedCodes,
                )
                updates.push(updatedProduct)
                logger.info(
                  `${product.product} (${product.product_id}) price-only seller ${currentSeller.seller} | price ${currentSeller.price}`,
                )
                report.items.push({
                  productId: product.product_id,
                  productName: product.product,
                  previousSeller: product.seller,
                  previousPrice: product.price,
                  nextSeller: product.seller,
                  nextPrice: currentSeller.price,
                  maxPriceBefore: product.max_price,
                  maxPriceAfter: updatedProduct.max_price,
                  codeBefore: product.code,
                  codeAfter: updatedProduct.code,
                  status: 'updated',
                  reason: 'price-only',
                })
                continue
              }

              const bestSellerSelection = pickBestSeller(
                product,
                sellerResponse.data,
                normalized.sellerFilter,
                normalized.sellerPriority,
                category.id,
                category.name,
                brandId,
                brandInfo.name,
                product.product_details.type.id,
                typeNameById.get(product.product_details.type.id) ??
                  product.product_details.type.id,
                perProductConfig,
              )

              const bestSeller = bestSellerSelection?.seller

              if (!bestSeller) {
                report.stats.skippedNoSeller += 1
                report.errors.push({ message: 'Seller tidak ditemukan' })
                report.items.push({
                  productId: product.product_id,
                  productName: product.product,
                  previousSeller: product.seller,
                  previousPrice: product.price,
                  maxPriceBefore: product.max_price,
                  maxPriceAfter: product.max_price,
                  codeBefore: product.code,
                  codeAfter: product.code,
                  status: 'skipped',
                  reason: 'seller-not-found',
                })
                logger.warn(`No eligible seller for ${product.product} (${product.product_id}).`)
                continue
              }

              const updatedProduct = applySellerToProduct(
                product,
                bestSeller,
                normalized.autoFillProductCode,
                normalized.maxPrice,
                usedCodes,
              )
              updates.push(updatedProduct)
              const sellerChanged = product.seller !== bestSeller.seller
              const sellerLabel = sellerChanged
                ? `seller ${product.seller || '-'} -> ${bestSeller.seller}`
                : `seller ${bestSeller.seller}`

              let sourceLabel = 'source fallback termurah'
              if (bestSellerSelection?.source === 'priority-list') {
                sourceLabel = `source list ${bestSellerSelection.priorityScope ?? 'unknown'}`
              }
              if (bestSellerSelection?.source === 'priority-overridden') {
                const gap = bestSellerSelection.priceGap ?? 0
                sourceLabel = `source list ${bestSellerSelection.priorityScope ?? 'unknown'} terkalahkan: ${bestSellerSelection.overriddenPrioritySeller ?? '-'} -> ${bestSeller.seller} (selisih ${gap})`
              }

              logger.info(
                `${product.product} (${product.product_id}) ${sellerLabel} | price ${bestSeller.price} | ${sourceLabel}`,
              )

              const selectionReason =
                bestSellerSelection?.source === 'priority-overridden'
                  ? `seller-priority-overridden-${bestSellerSelection.priorityScope ?? 'unknown'}`
                  : bestSellerSelection?.source === 'priority-list'
                    ? `seller-priority-${bestSellerSelection.priorityScope ?? 'unknown'}`
                    : 'seller-fallback-cheapest'

              report.items.push({
                productId: product.product_id,
                productName: product.product,
                previousSeller: product.seller,
                previousPrice: product.price,
                nextSeller: bestSeller.seller,
                nextPrice: bestSeller.price,
                maxPriceBefore: product.max_price,
                maxPriceAfter: updatedProduct.max_price,
                codeBefore: product.code,
                codeAfter: updatedProduct.code,
                status: 'updated',
                reason: `${sellerChanged ? 'seller-changed' : 'seller-confirmed'}|${selectionReason}`,
              })
            } catch (error) {
              const detail = extractErrorDetail(error)
              report.errors.push(detail)
              report.items.push({
                productId: product.product_id,
                productName: product.product,
                previousSeller: product.seller,
                previousPrice: product.price,
                maxPriceBefore: product.max_price,
                maxPriceAfter: product.max_price,
                codeBefore: product.code,
                codeAfter: product.code,
                status: 'error',
                reason: detail.message,
              })
              logger.error(
                `Seller lookup failed for ${product.product} (${product.product_id}): ${detail.message}`,
              )
            }
          }

          if (updates.length === 0) {
            logger.warn('No updates prepared for this brand.')
          } else {
            logger.info(
              `Prepared ${updates.length} update(s). Skipped: ${report.stats.skippedNotProblematic} not-problematic, ${report.stats.skippedNoSeller} no-seller.`,
            )
            try {
              await sleep(normalized.requestDelayMs)
              const updateResult = await digiflazz.updateMultiple({ products: updates })
              report.stats.updated = updates.length
              report.updateMessage = updateResult.message
              logger.success(`Update result: ${updateResult.message}`)
            } catch (error) {
              const detail = extractErrorDetail(error)
              report.errors.push(detail)
              report.failedSample = updates.slice(0, 3).map((item) => ({
                productId: item.product_id,
                code: item.code,
                price: item.price,
                max_price: item.max_price,
                seller: item.seller,
                seller_sku_id: item.seller_sku_id,
              }))
              logger.error(`Update multiple failed: ${detail.message}`)
              const errors = extractErrorMessages(detail)
              if (errors.length) {
                logger.error(`Update multiple errors: ${errors.join(' | ')}`)
              }
            }
          }

          reports.push(report)
        }
      } catch (error) {
        const detail = extractErrorDetail(error)
        logger.error(`Category ${category.name} failed: ${detail.message}`)
      }
    }

    return reports
  },
}
