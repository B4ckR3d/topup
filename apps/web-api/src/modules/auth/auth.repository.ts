import { Injectable } from '@nestjs/common'
import { and, eq, type InferInsertModel } from '@umbreon/db'
import { OAuthProvider, tb } from '@umbreon/db/types'
import type { DBInstance } from 'src/common/types/db-instance'
import { DatabaseService } from 'src/core/database/database.service'

type SessionInsert = InferInsertModel<typeof tb.sessions>
type UserInsert = InferInsertModel<typeof tb.users>
type OauthAccountInsert = InferInsertModel<typeof tb.oauthAccounts>
type PasskeyCredentialInsert = InferInsertModel<typeof tb.passkeyCredentials>

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  // ==================== User Methods ====================

  async findUserByEmail(email: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    return db.query.users.findFirst({
      where: eq(tb.users.email, email),
    })
  }

  async findUserById(userId: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    return db.query.users.findFirst({
      where: eq(tb.users.id, userId),
    })
  }

  async createUser(data: UserInsert, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    const [user] = await db.insert(tb.users).values(data).returning({
      id: tb.users.id,
      email: tb.users.email,
      name: tb.users.name,
      role: tb.users.role,
    })
    return user
  }

  // ==================== Session Methods ====================

  /**
   * Find session by user ID and device fingerprint (primary) or device ID (fallback)
   */
  async findSessionByUserAndDevice(
    userId: string,
    deviceId: string,
    fingerprint?: string,
    tx?: DBInstance,
  ) {
    const db = tx ?? this.databaseService.db

    // If fingerprint is provided, search by fingerprint first (more accurate)
    if (fingerprint) {
      const sessionByFingerprint = await db.query.sessions.findFirst({
        where: and(
          eq(tb.sessions.user_id, userId),
          eq(tb.sessions.device_fingerprint, fingerprint),
        ),
      })

      if (sessionByFingerprint) {
        return sessionByFingerprint
      }
    }

    // Fallback to device_id search
    return db.query.sessions.findFirst({
      where: and(eq(tb.sessions.user_id, userId), eq(tb.sessions.device_id, deviceId)),
    })
  }

  /**
   * Find all sessions for a user to check for similar devices
   */
  async findAllSessionsByUserId(userId: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    return db.query.sessions.findMany({
      where: eq(tb.sessions.user_id, userId),
      orderBy: (sessions, { desc }) => [desc(sessions.updated_at)],
    })
  }

  async findSessionByAccessToken(accessToken: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    return db.query.sessions.findFirst({
      where: eq(tb.sessions.access_token, accessToken),
    })
  }

  async findSessionByRefreshToken(refreshToken: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    return db.query.sessions.findFirst({
      where: eq(tb.sessions.refresh_token, refreshToken),
      with: {
        user: true,
      },
    })
  }

  async createSession(data: SessionInsert, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    const [session] = await db.insert(tb.sessions).values(data).returning({
      id: tb.sessions.id,
    })
    return session
  }

  async updateSession(sessionId: string, data: Partial<SessionInsert>, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    const [session] = await db
      .update(tb.sessions)
      .set(data)
      .where(eq(tb.sessions.id, sessionId))
      .returning({
        id: tb.sessions.id,
      })
    return session
  }

  async deleteSession(sessionId: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    await db.delete(tb.sessions).where(eq(tb.sessions.id, sessionId))
  }

  // ==================== Passkey Methods ====================

  async findPasskeyCredentialsByUserId(userId: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    return db.query.passkeyCredentials.findMany({
      where: eq(tb.passkeyCredentials.user_id, userId),
    })
  }

  async findPasskeyCredentialByCredentialId(credentialId: string, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    return db.query.passkeyCredentials.findFirst({
      where: eq(tb.passkeyCredentials.credential_id, credentialId),
    })
  }

  async createPasskeyCredential(data: PasskeyCredentialInsert, tx?: DBInstance) {
    const db = tx ?? this.databaseService.db
    const [row] = await db.insert(tb.passkeyCredentials).values(data).returning({
      id: tb.passkeyCredentials.id,
      user_id: tb.passkeyCredentials.user_id,
      credential_id: tb.passkeyCredentials.credential_id,
    })
    return row
  }

  async updatePasskeyCredential(
    credentialId: string,
    data: Partial<PasskeyCredentialInsert>,
    tx?: DBInstance,
  ) {
    const db = tx ?? this.databaseService.db
    const [row] = await db
      .update(tb.passkeyCredentials)
      .set(data)
      .where(eq(tb.passkeyCredentials.credential_id, credentialId))
      .returning({
        id: tb.passkeyCredentials.id,
      })
    return row
  }

  // ==================== OAuth Account Methods ====================

  async findOauthAccountByProviderUserId(provider: OAuthProvider, providerUserId: string) {
    return this.databaseService.db.query.oauthAccounts.findFirst({
      where: and(
        eq(tb.oauthAccounts.provider, provider),
        eq(tb.oauthAccounts.provider_user_id, providerUserId),
      ),
    })
  }

  async findOauthAccountByProviderEmail(provider: OAuthProvider, providerEmail: string) {
    return this.databaseService.db.query.oauthAccounts.findFirst({
      where: and(
        eq(tb.oauthAccounts.provider, provider),
        eq(tb.oauthAccounts.provider_email, providerEmail),
      ),
    })
  }

  async createOauthAccount(data: OauthAccountInsert) {
    const [row] = await this.databaseService.db.insert(tb.oauthAccounts).values(data).returning({
      id: tb.oauthAccounts.id,
      user_id: tb.oauthAccounts.user_id,
      provider: tb.oauthAccounts.provider,
    })
    return row
  }
}
