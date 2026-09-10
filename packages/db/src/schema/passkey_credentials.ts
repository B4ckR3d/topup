import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const passkeyCredentials = pgTable(
  'passkey_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    credential_id: text('credential_id').notNull().unique(),
    public_key: text('public_key').notNull(),
    counter: integer('counter').notNull().default(0),
    transports: varchar('transports', { length: 255 }),
    credential_device_type: varchar('credential_device_type', { length: 32 }),
    credential_backed_up: boolean('credential_backed_up').notNull().default(false),
    aaguid: varchar('aaguid', { length: 64 }),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index('passkey_credentials_user_idx').on(table.user_id),
  }),
)

export const passkeyCredentialRelations = relations(passkeyCredentials, ({ one }) => ({
  user: one(users, {
    fields: [passkeyCredentials.user_id],
    references: [users.id],
  }),
}))
