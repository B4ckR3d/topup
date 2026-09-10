import { createHash, createHmac, randomUUID } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import { and, eq } from '@umbreon/db'
import { LoginIsFrom, tb, UserRegisteredType, UserRole } from '@umbreon/db/types'
import vine from '@vinejs/vine'
import { compare, hash } from 'bcrypt-ts'
import { db } from '#database/db'
import { TwoFactorService } from '#services/two_factor_service'
import { loginValidator, registerValidator } from '#validators/auth'

const ACCESS_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60
const ACCESS_TOKEN_MS = ACCESS_TOKEN_EXPIRY_SECONDS * 1000
const REFRESH_TOKEN_MS = REFRESH_TOKEN_EXPIRY_SECONDS * 1000

type TokenPayload = {
  id: string
  role: string
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url')
}

function signJwt(payload: TokenPayload, secret: string, expiresInSeconds: number) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    }),
  )
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')

  return `${header}.${body}.${signature}`
}

function getBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('chrome') && !ua.includes('chromium')) return 'Chrome'
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('msie') || ua.includes('trident')) return 'IE'
  return 'Unknown'
}

function getOs(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'iOS'
  if (ua.includes('linux')) return 'Linux'
  return 'Unknown'
}

function getDeviceType(userAgent: string) {
  if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) return 'tablet'
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(userAgent))
    return 'mobile'
  return 'desktop'
}

function getDeviceInfo(deviceId: string, userAgent: string) {
  const browser = getBrowser(userAgent)
  const os = getOs(userAgent)
  const deviceType = getDeviceType(userAgent)
  const fingerprint = createHash('sha256')
    .update([deviceId, browser, os, deviceType, ''].join('|'))
    .digest('hex')
    .substring(0, 32)

  return {
    browser,
    os,
    deviceType,
    fingerprint,
  }
}

function getLoginSource(deviceType: string): LoginIsFrom {
  if (deviceType === 'mobile') return LoginIsFrom.MOBILE
  if (deviceType === 'desktop') return LoginIsFrom.DESKTOP
  return LoginIsFrom.WEB
}

export default class AuthController {
  private generateTokens(payload: TokenPayload) {
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required for admin authentication')
    }

    return {
      accessToken: signJwt(payload, jwtSecret, ACCESS_TOKEN_EXPIRY_SECONDS),
      refreshToken: signJwt(payload, jwtSecret, REFRESH_TOKEN_EXPIRY_SECONDS),
      accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_MS),
      refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
    }
  }

  private getDeviceId(ctx: HttpContext) {
    const sessionDeviceId = ctx.session.get('auth_device_id')
    if (sessionDeviceId) {
      return sessionDeviceId
    }

    const generatedDeviceId = randomUUID()
    ctx.session.put('auth_device_id', generatedDeviceId)
    return generatedDeviceId
  }

  private getIpAddress(ctx: HttpContext) {
    return (
      ctx.request.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      ctx.request.header('x-real-ip') ||
      ctx.request.ip() ||
      '127.0.0.1'
    )
  }

  public async register({ inertia, response, session }: HttpContext) {
    const isRegistrationEnabled = process.env.ADMIN_REGISTRATION_ENABLED === 'true'
    if (!isRegistrationEnabled) {
      session.flashErrors({
        error: 'Pendaftaran admin saat ini dinonaktifkan. Silakan hubungi Superadmin.',
      })
      return response.redirect('/auth/login')
    }

    return inertia.render('auth/register', {
      title: 'Register',
      description: 'Create a new account to access the admin panel.',
    })
  }

  public async postRegister(ctx: HttpContext) {
    const isRegistrationEnabled = process.env.ADMIN_REGISTRATION_ENABLED === 'true'
    if (!isRegistrationEnabled) {
      ctx.session.flashErrors({
        error: 'Pendaftaran admin saat ini dinonaktifkan. Silakan hubungi Superadmin.',
      })
      return ctx.response.redirect('/auth/login')
    }

    const data = await ctx.request.validateUsing(vine.compile(registerValidator))

    const user = await db.query.users.findFirst({
      where: eq(tb.users.email, data.email),
    })

    if (user) {
      ctx.session.flashErrors({
        error: 'Email already exists',
      })
      return ctx.response.redirect().back()
    }

    const hashedPassword = await hash(data.password, 10)
    const newUser = await db
      .insert(tb.users)
      .values({
        role: UserRole.USER,
        registered_type: UserRegisteredType.LOCAL,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
      })
      .returning()

    if (newUser.length === 0) {
      ctx.session.flashErrors({
        error: 'Failed to create user. Please try again later.',
      })
      return ctx.response.redirect().back()
    }

    ctx.session.flashMessages.set('success', 'User registered successfully. You can now log in.')
    return ctx.response.redirect('/auth/login')
  }

  public async login({ inertia }: HttpContext) {
    return inertia.render('auth/login', {
      title: 'Pepek Login',
      description:
        'Masuk ke dashboard admin dengan kredensial akun dan autentikator 2FA terverifikasi.',
      twoFactorRequired: TwoFactorService.isRequired(),
      defaultTwoFactorSecret: TwoFactorService.getAdminSecret(),
      otpAuthUrl: TwoFactorService.getOtpAuthUrl('admin@umbreon.store', 'Pepek Admin'),
    })
  }

  public async postLogin(ctx: HttpContext) {
    const data = await ctx.request.validateUsing(vine.compile(loginValidator))

    try {
      const user = await db.query.users.findFirst({
        where: eq(tb.users.email, data.email),
      })

      if (!user) {
        ctx.session.flashErrors({
          error: 'Invalid email or password.',
        })
        return ctx.response.redirect().back()
      }

      const isPasswordValid = await compare(data.password, user.password)

      if (!isPasswordValid) {
        ctx.session.flashErrors({
          error: 'Invalid email or password.',
        })
        return ctx.response.redirect().back()
      }

      if (user.role !== UserRole.ADMIN) {
        ctx.session.flashErrors({
          error: 'Forbidden: You do not have permission to access this resource.',
        })
        return ctx.response.redirect().back()
      }

      // Check Two-Factor Authentication per User
      const twoFactorCode = data.two_factor_code?.trim()
      const isUser2FaEnabled = !!user.two_factor_enabled
      const isGlobal2FaRequired = TwoFactorService.isRequired()

      if (isUser2FaEnabled || isGlobal2FaRequired || twoFactorCode) {
        if (!twoFactorCode && (isUser2FaEnabled || isGlobal2FaRequired)) {
          ctx.session.flashErrors({
            error: 'Akun Anda mengaktifkan 2FA. Silakan masukkan kode Authenticator 6-digit.',
            two_factor_code: 'Kode Authenticator / 2FA wajib diisi.',
          })
          return ctx.response.redirect().back()
        }

        if (twoFactorCode) {
          const verification = await TwoFactorService.verifyUserCode(twoFactorCode, {
            two_factor_secret: user.two_factor_secret,
            two_factor_recovery_codes: user.two_factor_recovery_codes,
            pin_hash: user.pin_hash,
          })

          if (!verification.valid) {
            ctx.session.flashErrors({
              error: 'Kode Authenticator / 2FA tidak valid atau sudah kadaluarsa.',
              two_factor_code: 'Kode Authenticator / 2FA tidak valid atau sudah kadaluarsa.',
            })
            return ctx.response.redirect().back()
          }

          // If a recovery code was used, remove it from the remaining codes
          if (verification.usedRecoveryCode && user.two_factor_recovery_codes) {
            try {
              const storedCodes: string[] = JSON.parse(user.two_factor_recovery_codes)
              const updated = storedCodes.filter(
                (c) => c.toUpperCase() !== verification.usedRecoveryCode!.toUpperCase(),
              )
              await db
                .update(tb.users)
                .set({ two_factor_recovery_codes: JSON.stringify(updated) })
                .where(eq(tb.users.id, user.id))
            } catch {
              // ignore
            }
          }
        }
      }

      const deviceId = this.getDeviceId(ctx)
      const userAgent = ctx.request.header('user-agent') || 'web-admin'
      const ipAddress = this.getIpAddress(ctx)
      const deviceInfo = getDeviceInfo(deviceId, userAgent)
      const deviceName = `${deviceInfo.browser} on ${deviceInfo.os}`
      const tokens = this.generateTokens({ id: user.id, role: user.role })

      const sessionData = {
        user_id: user.id,
        device_id: deviceId,
        device_fingerprint: deviceInfo.fingerprint,
        device_name: deviceName,
        ip_address: ipAddress,
        user_agent: userAgent,
        login_type: UserRegisteredType.LOCAL,
        is_from: getLoginSource(deviceInfo.deviceType),
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        access_token_expires_at: tokens.accessTokenExpiresAt,
        refresh_token_expires_at: tokens.refreshTokenExpiresAt,
      }

      let existingSession = await db.query.sessions.findFirst({
        where: and(
          eq(tb.sessions.user_id, user.id),
          eq(tb.sessions.device_fingerprint, deviceInfo.fingerprint),
        ),
      })

      if (!existingSession) {
        existingSession = await db.query.sessions.findFirst({
          where: and(eq(tb.sessions.user_id, user.id), eq(tb.sessions.device_id, deviceId)),
        })
      }

      if (existingSession) {
        await db.update(tb.sessions).set(sessionData).where(eq(tb.sessions.id, existingSession.id))
      } else {
        await db.insert(tb.sessions).values(sessionData)
      }

      await ctx.auth.use('web').login(user)
      ctx.session.put('auth_access_token', tokens.accessToken)
      ctx.session.put('auth_refresh_token', tokens.refreshToken)

      ctx.session.flashMessages.set('success', 'You have been logged in successfully.')
      return ctx.response.redirect('/admin')
    } catch {
      ctx.session.flashErrors({
        error: 'Invalid email or password.',
      })
      return ctx.response.redirect().back()
    }
  }

  public async logout(ctx: HttpContext) {
    const accessToken = ctx.session.get('auth_access_token')

    if (accessToken) {
      const session = await db.query.sessions.findFirst({
        where: eq(tb.sessions.access_token, accessToken),
      })

      if (session) {
        await db.delete(tb.sessions).where(eq(tb.sessions.id, session.id))
      }
    }

    ctx.session.forget('auth_access_token')
    ctx.session.forget('auth_refresh_token')
    ctx.auth.use('web').logout()

    ctx.session.flashMessages.set('success', 'You have been logged out successfully.')
    return ctx.response.redirect('/auth/login')
  }
}
