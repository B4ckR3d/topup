import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { AuthCommonModule } from 'src/common/auth/auth-common.module'
import { DatabaseModule } from 'src/core/database/database.module'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { PasskeyService } from './services/passkey.service'

@Module({
  providers: [AuthService, AuthRepository, JwtStrategy, PasskeyService],
  controllers: [AuthController],
  exports: [AuthCommonModule],
  imports: [AuthCommonModule, DatabaseModule, ConfigModule, PassportModule],
})
export class AuthModule {}
