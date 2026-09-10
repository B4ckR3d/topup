import { BadRequestException, Body, Controller, Headers, Ip, Post, UseGuards } from '@nestjs/common'
import { ApiHeader, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from 'src/common/auth/guards/jwt.guard'
import { User } from 'src/common/decorators/user.decorator'
import type { TUser } from 'src/common/types/meta.type'
import { AuthService } from './auth.service'
import {
  GoogleLoginDto,
  LoginDto,
  PasskeyLoginOptionsDto,
  PasskeyLoginVerifyDto,
  PasskeyRegisterVerifyDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async getUsers(@Body() body: RegisterDto) {
    return this.authService.register(body)
  }

  @ApiHeader({
    name: 'X-Device-ID',
    description: 'Device ID from the client',
    required: true,
    examples: {
      example1: {
        value: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Example of a device ID',
      },
    },
  })
  @ApiHeader({
    name: 'user-agent',
    description: 'User agent from the client',
    required: true,
    examples: {
      example1: {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        description: 'Example of a user agent',
      },
    },
  })
  @Post('/login')
  async login(
    @Body() body: LoginDto,
    @Headers('X-Device-ID') deviceId: string,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    if (!ip || !userAgent || !deviceId) {
      throw new BadRequestException('Missing required headers')
    }

    return this.authService.login(body, {
      deviceId,
      ip,
      userAgent: userAgent,
    })
  }

  @ApiHeader({
    name: 'X-Device-ID',
    description: 'Device ID from the client',
    required: true,
  })
  @ApiHeader({
    name: 'user-agent',
    description: 'User agent from the client',
    required: true,
  })
  @Post('/google')
  async loginWithGoogle(
    @Body() body: GoogleLoginDto,
    @Headers('X-Device-ID') deviceId: string,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    if (!ip || !userAgent || !deviceId) {
      throw new BadRequestException('Missing required headers')
    }

    return this.authService.loginWithGoogle(body, {
      deviceId,
      ip,
      userAgent,
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post('/passkey/register/options')
  async getPasskeyRegisterOptions(@User() user: TUser) {
    return this.authService.getPasskeyRegisterOptions(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('/passkey/register/verify')
  async verifyPasskeyRegistration(@User() user: TUser, @Body() body: PasskeyRegisterVerifyDto) {
    return this.authService.verifyPasskeyRegistration(user.id, body)
  }

  @Post('/passkey/login/options')
  async getPasskeyLoginOptions(@Body() body: PasskeyLoginOptionsDto) {
    return this.authService.getPasskeyLoginOptions(body)
  }

  @ApiHeader({
    name: 'X-Device-ID',
    description: 'Device ID from the client',
    required: true,
  })
  @ApiHeader({
    name: 'user-agent',
    description: 'User agent from the client',
    required: true,
  })
  @Post('/passkey/login/verify')
  async verifyPasskeyLogin(
    @Body() body: PasskeyLoginVerifyDto,
    @Headers('X-Device-ID') deviceId: string,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    if (!ip || !userAgent || !deviceId) {
      throw new BadRequestException('Missing required headers')
    }

    return this.authService.verifyPasskeyLogin(body, {
      deviceId,
      ip,
      userAgent,
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logout(@Headers('Authorization') accessToken: string) {
    return this.authService.logout(accessToken.split(' ')[1])
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Menggunakan refresh token untuk mendapatkan access token baru',
  })
  @Post('/refresh')
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refresh_token)
  }
}
