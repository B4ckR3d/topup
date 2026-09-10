import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const registerValidator = vine.object({
  name: vine.string().minLength(3),
  email: vine
    .string()
    .email({
      require_tld: true,
    })
    .normalizeEmail({
      all_lowercase: true,
      gmail_lowercase: true,
      gmail_remove_dots: true,
    }),
  phone: vine.string().startsWith('62'),
  password: vine
    .string()
    .minLength(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/),
  password_confirmation: vine.string().minLength(8).sameAs('password'),
})

export type RegisterValidator = Infer<typeof registerValidator>

export const loginValidator = vine.object({
  email: vine
    .string()
    .email({
      require_tld: true,
    })
    .normalizeEmail({
      all_lowercase: true,
      gmail_lowercase: true,
    }),
  password: vine.string().minLength(1),
  two_factor_code: vine.string().optional(),
})

export type LoginValidator = Infer<typeof loginValidator>
