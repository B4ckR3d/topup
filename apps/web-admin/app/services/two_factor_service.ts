import { createHmac } from 'node:crypto'
import { compare } from 'bcrypt-ts'

/**
 * Standard Base32 alphabet for RFC 4648 (Google Authenticator compatible)
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(base32: string): Buffer {
  const cleaned = base32
    .toUpperCase()
    .replace(/=+$/, '')
    .replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const output: number[] = []

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i])
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

function getTotpAtCounter(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32)
  if (key.length === 0) return ''

  const buffer = Buffer.alloc(8)
  buffer.writeBigInt64BE(BigInt(counter), 0)

  const hmac = createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = binary % 1000000
  return otp.toString().padStart(6, '0')
}

export class TwoFactorService {
  /**
   * Default Base32 secret for Admin TOTP (Google Authenticator / Authy)
   */
  public static readonly DEFAULT_SECRET = 'PEPEKADMIN2FASECRET2026KEY123'
  public static readonly DEFAULT_BACKUP_CODE = '123456'

  public static getAdminSecret(): string {
    return process.env.ADMIN_2FA_SECRET || TwoFactorService.DEFAULT_SECRET
  }

  public static getBackupCode(): string {
    return process.env.ADMIN_2FA_BACKUP_CODE || TwoFactorService.DEFAULT_BACKUP_CODE
  }

  public static isRequired(): boolean {
    return process.env.ADMIN_2FA_REQUIRED === 'true'
  }

  /**
   * Generates current TOTP token (for testing or display)
   */
  public static generateCurrentToken(secret = TwoFactorService.getAdminSecret()): string {
    const epoch = Math.floor(Date.now() / 1000)
    const counter = Math.floor(epoch / 30)
    return getTotpAtCounter(secret, counter)
  }

  /**
   * Verifies a 6-digit TOTP token with +/- 1 time-step drift
   */
  public static verifyTotp(
    token: string,
    secret = TwoFactorService.getAdminSecret(),
    window = 1,
  ): boolean {
    const cleanToken = token.trim()
    if (!/^\d{6}$/.test(cleanToken)) return false

    const epoch = Math.floor(Date.now() / 1000)
    const currentCounter = Math.floor(epoch / 30)

    for (let delta = -window; delta <= window; delta++) {
      const expected = getTotpAtCounter(secret, currentCounter + delta)
      if (expected && expected === cleanToken) {
        return true
      }
    }
    return false
  }

  /**
   * Comprehensive 2FA validator:
   * 1. Checks standard TOTP (Google Authenticator / Authy)
   * 2. Checks backup code (ADMIN_2FA_BACKUP_CODE)
   * 3. Checks user's PIN if user has pin_hash in database
   */
  public static async verifyCode(
    code: string,
    options?: {
      userPinHash?: string | null
      customSecret?: string | null
    },
  ): Promise<boolean> {
    const cleanCode = code.trim()
    if (!cleanCode) return false

    // 1. Verify against TOTP secret
    const secret = options?.customSecret || TwoFactorService.getAdminSecret()
    if (TwoFactorService.verifyTotp(cleanCode, secret)) {
      return true
    }

    // 2. Verify against Admin 2FA backup code
    const backupCode = TwoFactorService.getBackupCode()
    if (backupCode && cleanCode === backupCode) {
      return true
    }

    // 3. Verify against user's PIN hash if present
    if (options?.userPinHash) {
      try {
        const isPinValid = await compare(cleanCode, options.userPinHash)
        if (isPinValid) return true
      } catch {
        // ignore pin compare error
      }
    }

    return false
  }

  /**
   * Generates standard otpauth URL for QR code setup
   */
  public static getOtpAuthUrl(
    account = 'admin@umbreon.store',
    issuer = 'Pepek Admin',
    secret = TwoFactorService.getAdminSecret(),
  ): string {
    const encodedIssuer = encodeURIComponent(issuer)
    const encodedAccount = encodeURIComponent(account)
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
  }
}
