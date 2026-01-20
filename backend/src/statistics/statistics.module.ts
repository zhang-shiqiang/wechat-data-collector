import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { WechatAccount } from '../account/entities/account.entity';
import { Article } from '../article/entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WechatAccount, Article])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
