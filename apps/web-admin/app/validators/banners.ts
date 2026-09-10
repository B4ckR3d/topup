import { BannerLocation } from '@umbreon/db/types'
import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const createBannerValidator = vine.object({
  title: vine.string().trim().minLength(1),
  image_id: vine.string().uuid(),
  description: vine.string().nullable().optional(),
  is_available: vine.boolean().optional(),
  product_category_id: vine.string().uuid().nullable().optional(),
  banner_location: vine.enum(BannerLocation).optional(),
  href_url: vine.string().url().nullable().optional(),
  app_url: vine.string().url().nullable().optional(),
})

export type CreateBannerValidator = Infer<typeof createBannerValidator>
