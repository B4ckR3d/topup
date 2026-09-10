import { createHmac, randomBytes } from 'node:crypto'
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
  public static readonly DEFAULT_SECRET = 'UMBREONADMIN2FASECRET2026KEY123'
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
   * Generates a cryptographically random Base32 secret for a user
   */
  public static generateUserSecret(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const randomBytesBuffer = randomBytes(length)
    let secret = ''
    for (let i = 0; i < length; i++) {
      secret += chars[randomBytesBuffer[i] % chars.length]
    }
    return secret
  }

  /**
   * Generates formatted backup recovery codes (e.g., 5 codes of format XXXX-XXXX)
   */
  public static generateRecoveryCodes(count = 6): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const part1 = randomBytes(2).toString('hex').toUpperCase()
      const part2 = randomBytes(2).toString('hex').toUpperCase()
      codes.push(`${part1}-${part2}`)
    }
    return codes
  }

  /**
   * Verifies a code against a specific user's database records:
   * 1. Check user's individual TOTP secret
   * 2. Check user's recovery codes (and identify if one was matched)
   * 3. Check user's PIN hash
   * 4. Check master emergency backup code (123456)
   */
  public static async verifyUserCode(
    code: string,
    user: {
      two_factor_secret?: string | null
      two_factor_recovery_codes?: string | null
      pin_hash?: string | null
    },
  ): Promise<{ valid: boolean; usedRecoveryCode?: string }> {
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return { valid: false }

    // 1. Verify against user's specific TOTP secret
    if (user.two_factor_secret && /^\d{6}$/.test(cleanCode)) {
      if (TwoFactorService.verifyTotp(cleanCode, user.two_factor_secret)) {
        return { valid: true }
      }
    }

    // 2. Verify against single-use recovery codes
    if (user.two_factor_recovery_codes) {
      try {
        const storedCodes: string[] = JSON.parse(user.two_factor_recovery_codes)
        const matchingCode = storedCodes.find((c) => c.toUpperCase() === cleanCode)
        if (matchingCode) {
          return { valid: true, usedRecoveryCode: matchingCode }
        }
      } catch {
        // if comma separated
        const storedCodes = user.two_factor_recovery_codes.split(',').map((c) => c.trim())
        const matchingCode = storedCodes.find((c) => c.toUpperCase() === cleanCode)
        if (matchingCode) {
          return { valid: true, usedRecoveryCode: matchingCode }
        }
      }
    }

    // 3. Verify against user PIN
    if (user.pin_hash) {
      try {
        const isPinValid = await compare(code.trim(), user.pin_hash)
        if (isPinValid) return { valid: true }
      } catch {
        // ignore
      }
    }

    // 4. Fallback master backup code (emergency access)
    const masterBackup = TwoFactorService.getBackupCode()
    if (masterBackup && code.trim() === masterBackup) {
      return { valid: true }
    }

    return { valid: false }
  }

  /**
   * Generates standard otpauth URL for QR code setup
   */
  public static getOtpAuthUrl(
    account = 'admin@umbreon.store',
    issuer = 'Umbreon Store Admin',
    secret = TwoFactorService.getAdminSecret(),
  ): string {
    const encodedIssuer = encodeURIComponent(issuer)
    const encodedAccount = encodeURIComponent(account)
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
  }
}
