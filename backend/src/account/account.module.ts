import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { FetchService } from './fetch.service';
import { WechatAccount } from './entities/account.entity';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [TypeOrmModule.forFeature([WechatAccount]), ArticleModule],
  controllers: [AccountController],
  providers: [AccountService, FetchService],
  exports: [AccountService],
})
export class AccountModule {}

