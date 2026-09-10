import { Module } from '@nestjs/common'
import { AppConfigModule } from './core/config/config.module'
import { DatabaseModule } from './core/database/database.module'
import { AppLoggerModule } from './core/logger/logger.module'
import { QueueModule } from './core/queue/queue.module'
import { StorageModule } from './core/storage/storage.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { ModulesModule } from './modules/modules.module'

@Module({
  imports: [
    AppLoggerModule,
    AppConfigModule,
    DatabaseModule,
    QueueModule,
    StorageModule,
    IntegrationsModule,
    ModulesModule,
  ],
})
export class AppModule {}
