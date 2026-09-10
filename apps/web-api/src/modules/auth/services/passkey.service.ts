import { randomBytes } from 'node:crypto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthRepository } from '../auth.repository'
import type {
  PasskeyLoginOptionsDto,
  PasskeyLoginVerifyDto,
  PasskeyRegisterVerifyDto,
} from '../dto/auth.dto'

interface LoginHeaders {
  deviceId: string
  ip: string
  userAgent: string
}

/**
 * Passkey Service - Implements WebAuthn (FIDO2) authentication
 *
 * Flow:
 * 1. Registration options: Generate challenge, send to client
 * 2. Registration verify: Validate response, store public key
 * 3. Login options: Generate challenge, send to client
 * 4. Login verify: Validate response, update counter, create session
 *
 * Note: This implementation uses stubs for WebAuthn verification.
 * In production, integrate @simplewebauthn/server for full verification.
 */
@Injectable()
export class PasskeyService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
  ) {}

  private generateChallenge(): string {
    return randomBytes(32).toString('base64url')
  }

  private encodeChallenge(challenge: string): string {
    return Buffer.from(challenge).toString('base64')
  }

  private extractDbErrorCode(error: unknown): string | undefined {
    let current: any = error
    for (let i = 0; i < 5 && current; i++) {
      if (typeof current.code === 'string') {
        return current.code
      }
      current = current.cause
    }
    return undefined
  }

  async getPasskeyRegisterOptions(userId: string) {
    const user = await this.authRepository.findUserById(userId)

    if (!user) {
      throw new BadRequestException('User not found')
    }

    const challenge = this.generateChallenge()
    const challengeToken = this.encodeChallenge(challenge)

    // Fallback ke [] agar proses register tetap jalan bila query exclude gagal
    const existingCredentials = await this.authRepository
      .findPasskeyCredentialsByUserId(user.id)
      .catch(() => [])

    return {
      success: true,
      data: {
        challenge_token: challengeToken,
        // WebAuthn options yang dikirim ke client
        options: {
          challenge,
          rp: {
            name: this.configService.get('WEBAUTHN_RP_NAME') || 'Umbreon Store',
            id: this.configService.get('WEBAUTHN_RP_ID') || 'localhost',
          },
          user: {
            id: Buffer.from(user.id).toString('base64url'),
            name: user.email,
            displayName: user.name,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          timeout: 60000,
          attestation: 'direct',
          excludeCredentials: existingCredentials.map((cred) => ({
            id: cred.credential_id,
            type: 'public-key',
            transports: cred.transports?.split(',') || ['internal'],
          })),
        },
      },
    }
  }

  async verifyPasskeyRegistration(userId: string, data: PasskeyRegisterVerifyDto) {
    const user = await this.authRepository.findUserById(userId)

    if (!user) {
      throw new BadRequestException('User not found')
    }

    // TODO: Implement full WebAuthn verification using @simplewebauthn/server
    // verifyRegistrationResponse() here
    const response = data.response as any

    if (!response || !response.id) {
      throw new BadRequestException('Invalid passkey registration response')
    }

    // Store credential (public key, counter, transports)
    const credentialId = String(response.id)
    const transportList = Array.isArray(response.response?.transports)
      ? response.response.transports.map((item: any) => String(item).trim()).filter(Boolean)
      : []
    const publicKey = String(response.response?.publicKey || '')
    const signCount = Number(response.response?.signCount || 0)
    const transports = (transportList.length > 0 ? transportList.join(',') : 'internal').slice(
      0,
      255,
    )
    const credentialDeviceType = (transportList[0] || 'platform').slice(0, 32)

    try {
      await this.authRepository.createPasskeyCredential({
        user_id: user.id,
        credential_id: credentialId,
        public_key: publicKey,
        counter: signCount,
        transports,
        credential_device_type: credentialDeviceType,
        credential_backed_up: transportList.includes('internal'),
        aaguid: null,
      })
    } catch (error: any) {
      Logger.error('Failed to save passkey credential', error)
      const dbCode = this.extractDbErrorCode(error)

      if (dbCode === '23505') {
        return {
          success: true,
          message: 'Passkey already registered',
        }
      }
      if (dbCode === '42P01') {
        throw new BadRequestException(
          'Passkey table is not initialized. Please run database migration',
        )
      }
      throw new BadRequestException(
        `Failed to save passkey credential${dbCode ? ` (${dbCode})` : ''}`,
      )
    }

    return {
      success: true,
      message: 'Passkey registered successfully',
    }
  }

  async getPasskeyLoginOptions(data: PasskeyLoginOptionsDto) {
    const challenge = this.generateChallenge()
    const challengeToken = this.encodeChallenge(challenge)

    if (!data.email) {
      return {
        success: true,
        data: {
          challenge_token: challengeToken,
          options: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: this.configService.get('WEBAUTHN_RP_ID') || 'localhost',
          },
        },
      }
    }

    const user = await this.authRepository.findUserByEmail(data.email)

    if (!user) {
      throw new BadRequestException('User not found')
    }

    // Get user's passkey credentials
    const credentials = await this.authRepository.findPasskeyCredentialsByUserId(user.id)

    if (credentials.length === 0) {
      throw new BadRequestException('No passkey found for this user')
    }

    return {
      success: true,
      data: {
        challenge_token: challengeToken,
        options: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: this.configService.get('WEBAUTHN_RP_ID') || 'localhost',
          allowCredentials: credentials.map((cred) => ({
            id: cred.credential_id,
            type: 'public-key',
            transports: cred.transports?.split(',') || ['internal'],
          })),
        },
      },
    }
  }

  async verifyPasskeyLogin(data: PasskeyLoginVerifyDto, _headers: LoginHeaders) {
    const response = data.response as any

    if (!response || !response.id) {
      throw new BadRequestException('Invalid passkey assertion response')
    }

    // Find credential
    const credential = await this.authRepository.findPasskeyCredentialByCredentialId(response.id)

    if (!credential) {
      throw new BadRequestException('Credential not found')
    }

    const user = await this.authRepository.findUserById(credential.user_id)

    if (!user) {
      throw new BadRequestException('User not found')
    }

    if (data.email && user.email !== data.email) {
      throw new BadRequestException('Credential does not belong to this user')
    }

    // TODO: Implement full WebAuthn verification using @simplewebauthn/server
    // verifyAssertionResponse() here
    const signCount = Number(response.response?.signCount)
    const newCounter = Number.isFinite(signCount) ? signCount : credential.counter + 1

    // Check for replay attack (counter should increase)
    if (newCounter <= credential.counter) {
      throw new BadRequestException('Invalid counter value - possible replay attack')
    }

    // Update counter and last_used_at
    await this.authRepository.updatePasskeyCredential(response.id, {
      counter: newCounter,
      last_used_at: new Date(),
    })

    return {
      success: true,
      user_id: user.id,
      user_email: user.email,
      user_name: user.name,
    }
  }
}
