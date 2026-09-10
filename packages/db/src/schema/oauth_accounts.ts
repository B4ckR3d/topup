import { relations } from 'drizzle-orm'
import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { oauthProviderEnum } from './pg-enums'
import { users } from './users'

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    provider: oauthProviderEnum('provider').notNull(),
    provider_user_id: varchar('provider_user_id', { length: 255 }).notNull(),
    provider_email: varchar('provider_email', { length: 255 }).notNull(),
    display_name: varchar('display_name', { length: 255 }),
    avatar_url: varchar('avatar_url', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => ({
    providerUserUnique: uniqueIndex('oauth_accounts_provider_user_unique').on(
      table.provider,
      table.provider_user_id,
    ),
    providerEmailIdx: index('oauth_accounts_provider_email_idx').on(table.provider_email),
    userProviderIdx: index('oauth_accounts_user_provider_idx').on(table.user_id, table.provider),
  }),
)

export const oauthAccountRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.user_id],
    references: [users.id],
  }),
}))
