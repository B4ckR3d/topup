export type VipResellerProfileResponse = {
  result: boolean
  data?: {
    full_name: string
    username: string
    balance: number
    point: number
    level: string
    registered: string
  }
  message: string
}

export type VipResellerPrice = {
  basic: number
  premium: number
  special: number
}

export type VipResellerPrepaidService = {
  brand: string
  code: string
  name: string
  note: string
  price: VipResellerPrice
  status: string
  multi_trx: boolean
  category: string
  prepost: string
  type: string
}

export type VipResellerGameService = {
  code: string
  game: string
  name: string
  price: VipResellerPrice
  description: string
  server: string
  status: string
}

export type VipResellerNicknameResponse = {
  result: boolean
  data?: string
  country?: {
    code: string
    name: string
  }
  message: string
}

export type VipResellerOrderResponse = {
  result: boolean
  data?: {
    trxid: string
    data: string
    code: string
    service: string
    status: string
    note: string
    balance: number
    price: number
  }
  message: string
}
