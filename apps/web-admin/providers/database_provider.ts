import type { ApplicationService } from '@adonisjs/core/types'
import { closeDb } from '#database/db'

export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {}

  async shutdown() {
    await closeDb()
  }
}
