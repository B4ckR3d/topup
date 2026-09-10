import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  Equals,
  IsEmail,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
  ValidateIf,
} from 'class-validator'

export class LoginDto {
  @ApiProperty()
  @IsEmail({
    require_tld: true,
  })
  email: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password: string
}

export class RegisterDto {
  @ApiProperty()
  @IsEmail({
    require_tld: true,
  })
  email: string

  @ApiProperty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string

  @ApiProperty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @ValidateIf((o: RegisterDto) => o.password !== o.confirm_password)
  @Equals('password', {
    message: 'confirm_password do not match',
  })
  confirm_password: string

  @ApiProperty()
  @IsPhoneNumber('ID')
  phone: string

  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string
}

export class GoogleLoginDto {
  @ApiProperty()
  @IsString()
  id_token: string
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token yang diterima saat login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token: string
}

export class PasskeyRegisterOptionsDto {}

export class PasskeyRegisterVerifyDto {
  @ApiProperty({
    description: 'Token challenge dari endpoint register/options',
  })
  @IsString()
  challenge_token: string

  @ApiProperty({
    description: 'Body response hasil navigator.credentials.create()',
  })
  @IsObject()
  response: Record<string, unknown>
}

export class PasskeyLoginOptionsDto {
  @ApiPropertyOptional({
    description: 'Email user pemilik passkey (opsional untuk username-less passkey)',
    example: 'user@mail.com',
  })
  @IsOptional()
  @IsEmail({ require_tld: true })
  email?: string
}

export class PasskeyLoginVerifyDto {
  @ApiPropertyOptional({
    description: 'Email user yang sama dengan saat request options (opsional)',
    example: 'user@mail.com',
  })
  @IsOptional()
  @IsEmail({ require_tld: true })
  email?: string

  @ApiProperty({
    description: 'Token challenge dari endpoint login/options',
  })
  @IsString()
  challenge_token: string

  @ApiProperty({
    description: 'Body response hasil navigator.credentials.get()',
  })
  @IsObject()
  response: Record<string, unknown>
}
