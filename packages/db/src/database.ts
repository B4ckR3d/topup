import 'dotenv/config'

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

export type Database = PostgresJsDatabase<typeof schema>
export type DatabaseClient = ReturnType<typeof postgres>
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type CreateDatabaseOptions = NonNullable<Parameters<typeof postgres>[1]>

export type DatabaseConnection = {
  db: Database
  client: DatabaseClient
  close: () => Promise<void>
}

const getEnvVariable = (name: string) => {
  const value = process.env[name]
  if (value == null) throw new Error(`environment variable ${name} not found`)
  return value
}

export function createDatabase(
  databaseUrl: string,
  options: CreateDatabaseOptions = {},
): DatabaseConnection {
  const client = postgres(databaseUrl, {
    prepare: false,
    ...options,
  })

  const db = drizzle(client, { schema })

  return {
    db,
    client,
    close: () => client.end(),
  }
}

export function createDatabaseFromEnv(): DatabaseConnection {
  return createDatabase(getEnvVariable('DATABASE_URL'))
}
