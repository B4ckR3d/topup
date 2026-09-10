import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from 'src/common/auth/guards/jwt.guard'
import { User } from 'src/common/decorators/user.decorator'
import type { TUser } from 'src/common/types/meta.type'
import { ChangeEmailDto } from './dto/change-email.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { changePhoneNumberDto } from './dto/change-phone.dto'
import { ChangeProfileDto } from './dto/change-profile.dto'
import { SettingsService } from './settings.service'

@ApiTags('User')
@UseGuards(JwtAuthGuard)
@Controller('user/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('change-password')
  async changePassword(@Body() body: ChangePasswordDto, @User() _user: TUser) {
    return this.settingsService.changePassword(body, _user)
  }

  @Post('change-profile')
  async changeProfile(@Body() body: ChangeProfileDto, @User() _user: TUser) {
    return this.settingsService.changeProfile(body, _user)
  }

  @Post('change-phone-number')
  async changePhoneNumber(@Body() body: changePhoneNumberDto, @User() _user: TUser) {
    return this.settingsService.changePhoneNumber(body, _user)
  }

  @Post('change-email')
  async changeEmail(@Body() body: ChangeEmailDto, @User() _user: TUser) {
    return this.settingsService.changeEmail(body, _user)
  }
}
