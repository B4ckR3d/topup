import type { SyncConfig } from './update-products.config.types'

export const syncConfig: SyncConfig = {
  cookiesPath: 'cookies.json',
  categories: ['all'],
  subCategoryTypeIds: ['all'],
  excludeProductCodes: [],
  updateMode: 'seller',
  perProduct: {},
  report: {
    enabled: true,
    path: 'reports',
  },
  autoFillProductCode: {
    enabled: true,
    prefix: 'BP',
    length: 10,
  },
  maxPrice: {
    mode: 'markup',
    markup: {
      amount: 200,
      perCode: {} as Record<string, number>,
    },
  },
  onlyProblematic: false,
  problematicCriteria: {
    inactiveSeller: true,
    priceOverMax: true,
  },
  sellerFilter: {
    minRating: 4,
    minRatingSteps: [4, 3.5, 3],
    blacklist: ['CV SAGARAMOBILE'] as string[],
    requireActive: true,
    enforceMaxPrice: false,
  },
  sellerPriority: {
    listPriceGapRule: {
      enabled: true,
      allowCheapestNonListFallback: true,
      maxPriceGap: 1000,
      minRating: 4,
      minBuyerCount: 10,
    },
    global: {
      seller: [],
      blacklist: [],
    },
    perBrand: {
      PULSA: {
        seller: [
          'NARATAMA RELOAD',
          'PLANET BILLER',
          'payfi mobile',
          'Pay Store Mobile',
          'TETRALINK',
        ],
        blacklist: [],
      },
      GAME: {
        seller: [
          'NARATAMA RELOAD',
          'PLANET BILLER',
          'payfi mobile',
          'Pay Store Mobile',
          'ARENA GAMERS',
          'TOPUPKUY H2H',
          'KiosGame',
          'Ciblekstore',
          'YokCash',
        ],
        blacklist: [],
      },
    },
    perSubBrand: {},
  },
}
