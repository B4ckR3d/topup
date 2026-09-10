import { createDatabase } from '@umbreon/db'
import env from '#start/env'

const database = createDatabase(env.get('DATABASE_URL'))

export const db = database.db
export const closeDb = database.close
