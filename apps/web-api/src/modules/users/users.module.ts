import { Module } from '@nestjs/common'
import { AuthCommonModule } from 'src/common/auth/auth-common.module'
import { DatabaseModule } from 'src/core/database/database.module'
import { UsersController } from './users.controller'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

@Module({
  imports: [AuthCommonModule, DatabaseModule],
  exports: [UsersRepository],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
})
export class UsersModule {}
