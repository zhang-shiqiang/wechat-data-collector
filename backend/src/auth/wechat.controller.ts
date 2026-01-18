import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { WechatService } from './wechat.service';
import { UserService } from '../user/user.service';

@Controller('wechat')
export class WechatController {
  private readonly logger = new Logger(WechatController.name);

  constructor(
    private readonly wechatService: WechatService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取微信扫码登录的二维码URL
   */
  @Get('qrcode')
  getQRCodeUrl(@Query('redirectUri') redirectUri?: string) {
    try {
      // 回调地址应该是在微信开放平台配置的授权回调域名下的完整URL
      // 例如：如果授权回调域名配置为 localhost:3000，则回调地址为 http://localhost:3000/api/wechat/callback
      // 注意：回调地址必须是后端地址，因为需要后端处理微信的回调
      // 在微信开放平台配置授权回调域名时，只需要填写域名（如：localhost:3000），不需要填写完整URL
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const defaultRedirectUri = redirectUri || `${backendUrl}/api/wechat/callback`;
      
      this.logger.log(`生成二维码，回调地址: ${defaultRedirectUri}`);
      const qrCodeUrl = this.wechatService.getQRCodeUrl(defaultRedirectUri);
      
      return {
        code: 200,
        message: '获取成功',
        data: {
          qrCodeUrl,
        },
      };
    } catch (error: any) {
      this.logger.error(`获取二维码失败: ${error.message}`);
      return {
        code: 500,
        message: error.message || '获取二维码失败',
        data: null,
      };
    }
  }

  /**
   * 微信登录回调
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      if (!code) {
        return res.redirect('/login?error=no_code');
      }

      // 获取 access_token
      const tokenData = await this.wechatService.getAccessToken(code);
      
      // 获取用户信息
      const userInfo = await this.wechatService.getUserInfo(
        tokenData.access_token,
        tokenData.openid,
      );

      // 查找或创建用户
      // 这里可以根据 openid 或 unionid 查找用户
      // 如果不存在则创建新用户
      let user = await this.userService.findByWechatOpenId(tokenData.openid);
      
      if (!user) {
        // 创建新用户（使用临时密码，微信登录用户可以通过微信重新登录）
        const tempPassword = Math.random().toString(36).slice(-12);
        user = await this.userService.create({
          email: `${tokenData.openid}@wechat.temp`, // 临时邮箱
          username: userInfo.nickname || `wechat_${tokenData.openid.substring(0, 8)}`,
          password: tempPassword, // 临时密码
          nickname: userInfo.nickname,
        });
        
        // 更新用户头像（CreateUserDto 不包含 avatar，需要单独更新）
        if (userInfo.headimgurl) {
          user.avatar = userInfo.headimgurl;
          await this.userService.save(user);
        }
        
        // 保存微信 openid（需要在 User 实体中添加字段）
        // user.wechatOpenId = tokenData.openid;
        // if (tokenData.unionid) user.wechatUnionId = tokenData.unionid;
        // await this.userService.save(user);
      } else {
        // 更新用户信息
        if (userInfo.nickname) user.nickname = userInfo.nickname;
        if (userInfo.headimgurl) user.avatar = userInfo.headimgurl;
        await this.userService.save(user);
      }

      // 生成JWT token（这里简化处理，实际应该生成真实的JWT）
      const token = 'wechat_token_' + user.id; // TODO: 生成真实JWT

      // 重定向到前端，携带token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?token=${token}&wechat=1`);
    } catch (error: any) {
      this.logger.error(`微信登录失败: ${error.message}`);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
}

