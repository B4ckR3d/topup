import { createDatabaseFromEnv } from '@/database'
import { productCategorySeeds } from './seeds/product-category'
import { userSeed } from './seeds/user'
;(async () => {
  const database = createDatabaseFromEnv()

  try {
    await userSeed(database.db)
    await productCategorySeeds(database.db)
  } finally {
    await database.close()
  }
})()
