import {
  Controller,
  Get,
  Post,
  Body,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('wechat-cookies')
  async getWechatCookies(@Request() req) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const cookies = await this.settingsService.getWechatCookies(userId);
    return {
      code: 200,
      message: '获取成功',
      data: { cookies },
    };
  }

  @Post('wechat-cookies')
  async setWechatCookies(@Request() req, @Body() body: { cookies: string }) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    await this.settingsService.setWechatCookies(userId, body.cookies);
    return {
      code: 200,
      message: '更新成功',
      data: null,
    };
  }
}
