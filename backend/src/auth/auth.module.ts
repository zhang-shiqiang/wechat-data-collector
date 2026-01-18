import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WechatService } from './wechat.service';
import { WechatController } from './wechat.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, UserModule],
  controllers: [WechatController],
  providers: [WechatService],
  exports: [WechatService],
})
export class AuthModule {}

