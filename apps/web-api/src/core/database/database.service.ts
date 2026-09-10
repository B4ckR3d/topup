import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createDatabase, type Database, type DatabaseConnection } from '@umbreon/db'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('DatabaseService')
  private readonly connection: DatabaseConnection

  public readonly db: Database

  constructor(private readonly configService: ConfigService) {
    this.logger.log('Initializing database connection...')
    const databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL')
    this.connection = createDatabase(databaseUrl)
    this.db = this.connection.db
  }

  onModuleInit() {
    this.logger.log('Database connection initialized')
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection...')
    await this.connection?.close()
  }
}
