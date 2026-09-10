import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { DatabaseModule } from 'src/core/database/database.module'
import { JwtAuthGuard } from './guards/jwt.guard'
import { TransactionGuard } from './guards/transaction.guard'

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [JwtAuthGuard, TransactionGuard],
  exports: [JwtAuthGuard, TransactionGuard, JwtModule],
})
export class AuthCommonModule {}
