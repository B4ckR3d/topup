import { eq } from 'drizzle-orm'
import { createDatabaseFromEnv } from '@/database'
import { tb } from '@/table'
import { productCategorySeeds } from './seeds/product-category'
import { userSeed } from './seeds/user'

async function configSeed(db: any) {
  const configs = [
    { key: 'app.name', value: 'Umbreon Store' },
    { key: 'contact.telegram', value: 'https://t.me/hashfunction' },
  ]

  for (const cfg of configs) {
    const existing = await db.query.appConfig.findFirst({
      where: eq(tb.appConfig.key, cfg.key),
    })
    if (!existing) {
      await db.insert(tb.appConfig).values(cfg)
    }
  }
}

;(async () => {
  const database = createDatabaseFromEnv()

  try {
    console.log('[Seed] Seeding users...')
    await userSeed(database.db)
    console.log('[Seed] Seeding product categories...')
    await productCategorySeeds(database.db)
    console.log('[Seed] Seeding default app configs...')
    await configSeed(database.db)
    console.log('[Seed] All seeding completed successfully!')
  } catch (err) {
    console.error('[Seed Error]:', err)
  } finally {
    await database.close()
  }
})()
