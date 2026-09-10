import 'dotenv/config'

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { createDatabaseFromEnv } from '@/database'

const main = async () => {
  const database = createDatabaseFromEnv()

  try {
    await migrate(drizzle(database.client), {
      migrationsFolder: `${__dirname}/../drizzle`,
    })
  } finally {
    await database.close()
  }
}

void main()
