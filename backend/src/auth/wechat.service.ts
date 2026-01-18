import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(private configService: ConfigService) {
    // 从环境变量获取微信开放平台的 AppID 和 AppSecret
    // 需要在微信开放平台注册应用：https://open.weixin.qq.com/
    this.appId = this.configService.get<string>('WECHAT_APP_ID') || '';
    this.appSecret = this.configService.get<string>('WECHAT_APP_SECRET') || '';
  }

  /**
   * 生成微信扫码登录的二维码URL
   */
  getQRCodeUrl(redirectUri: string, state?: string): string {
    if (!this.appId) {
      throw new Error('微信 AppID 未配置，请在环境变量中设置 WECHAT_APP_ID');
    }

    const baseUrl = 'https://open.weixin.qq.com/connect/qrconnect';
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: encodeURIComponent(redirectUri),
      response_type: 'code',
      scope: 'snsapi_login',
      state: state || 'wechat_login',
    });

    return `${baseUrl}?${params.toString()}#wechat_redirect`;
  }

  /**
   * 通过 code 获取 access_token
   */
  async getAccessToken(code: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
  }> {
    try {
      const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
      const params = {
        appid: this.appId,
        secret: this.appSecret,
        code,
        grant_type: 'authorization_code',
      };

      const response = await axios.get(url, { params });
      const data = response.data;

      if (data.errcode) {
        throw new Error(`获取access_token失败: ${data.errmsg}`);
      }

      return data;
    } catch (error: any) {
      this.logger.error(`获取access_token失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 通过 access_token 获取用户信息
   */
  async getUserInfo(accessToken: string, openid: string): Promise<{
    openid: string;
    nickname: string;
    sex: number;
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: string[];
    unionid?: string;
  }> {
    try {
      const url = 'https://api.weixin.qq.com/sns/userinfo';
      const params = {
        access_token: accessToken,
        openid,
        lang: 'zh_CN',
      };

      const response = await axios.get(url, { params });
      const data = response.data;

      if (data.errcode) {
        throw new Error(`获取用户信息失败: ${data.errmsg}`);
      }

      return data;
    } catch (error: any) {
      this.logger.error(`获取用户信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 刷新 access_token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
  }> {
    try {
      const url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
      const params = {
        appid: this.appId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };

      const response = await axios.get(url, { params });
      const data = response.data;

      if (data.errcode) {
        throw new Error(`刷新access_token失败: ${data.errmsg}`);
      }

      return data;
    } catch (error: any) {
      this.logger.error(`刷新access_token失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 通过微信登录后，尝试获取用户关注的公众号列表
   * 注意：这个功能需要用户授权，且只能获取用户自己创建的公众号
   */
  async getSubscribedAccounts(accessToken: string): Promise<any[]> {
    // 注意：微信开放平台API通常不提供获取用户关注的所有公众号的接口
    // 这个功能可能需要使用微信公众平台的API，需要公众号管理员授权
    // 这里先返回空数组，后续可以根据实际需求实现
    this.logger.warn('获取用户关注的公众号列表功能需要公众号管理员授权');
    return [];
  }
}

