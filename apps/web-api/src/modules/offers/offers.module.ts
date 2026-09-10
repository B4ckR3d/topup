import { Module } from '@nestjs/common'
import { AuthCommonModule } from 'src/common/auth/auth-common.module'
import { DatabaseModule } from 'src/core/database/database.module'
import { OffersController } from './offers.controller'
import { OffersRepository } from './offers.repository'
import { OffersService } from './offers.service'

@Module({
  exports: [OffersRepository, OffersService],
  imports: [AuthCommonModule, DatabaseModule],
  controllers: [OffersController],
  providers: [OffersService, OffersRepository],
})
export class OffersModule {}
