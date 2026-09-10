import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { VipResellerService } from './vip-reseller.service'

@Module({
  imports: [ConfigModule],
  providers: [VipResellerService],
  exports: [VipResellerService],
})
export class VipResellerModule {}
