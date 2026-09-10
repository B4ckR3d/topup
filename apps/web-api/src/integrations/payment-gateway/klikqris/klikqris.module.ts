import { Module } from '@nestjs/common'
import { KlikQrisApiService } from './klikqris.api.service'
import { KlikQrisService } from './klikqris.service'

@Module({
  providers: [KlikQrisApiService, KlikQrisService],
  exports: [KlikQrisService, KlikQrisApiService],
})
export class KlikQrisModule {}
