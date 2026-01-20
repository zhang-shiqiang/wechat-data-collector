import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThan } from 'typeorm';
import { WechatAccount } from '../account/entities/account.entity';
import { Article } from '../article/entities/article.entity';

export interface DashboardOverview {
  totalAccounts: number;
  totalArticles: number;
  unreadArticles: number;
  todayAdded: number;
  trends: {
    totalAccounts: { value: number; isUp: boolean };
    totalArticles: { value: number; isUp: boolean };
    unreadArticles: { value: number; isUp: boolean };
    todayAdded: { value: number; isUp: boolean };
  };
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(WechatAccount)
    private accountRepository: Repository<WechatAccount>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  /**
   * 获取仪表盘概览数据
   */
  async getDashboardOverview(userId: number): Promise<DashboardOverview> {
    // 获取今天的开始和结束时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // 获取昨天的开始和结束时间
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // 获取今日数据
    const [
      totalAccounts,
      totalArticles,
      unreadArticles,
      todayAddedAccounts,
      todayAddedArticles,
    ] = await Promise.all([
      this.accountRepository.count({ where: { userId } }),
      this.articleRepository.count({ where: { userId } }),
      this.articleRepository.count({
        where: { userId, readStatus: 'unread' },
      }),
      this.accountRepository.count({
        where: {
          userId,
          createdAt: Between(today, todayEnd),
        },
      }),
      this.articleRepository.count({
        where: {
          userId,
          createdAt: Between(today, todayEnd),
        },
      }),
    ]);

    // 获取昨日数据用于对比
    const [
      yesterdayAddedAccounts,
      yesterdayAddedArticles,
      yesterdayUnreadArticles,
    ] = await Promise.all([
      this.accountRepository.count({
        where: {
          userId,
          createdAt: Between(yesterday, yesterdayEnd),
        },
      }),
      this.articleRepository.count({
        where: {
          userId,
          createdAt: Between(yesterday, yesterdayEnd),
        },
      }),
      // 获取昨天结束时的未读文章数（需要查询昨天之前创建且未读的文章）
      this.articleRepository.count({
        where: {
          userId,
          readStatus: 'unread',
          createdAt: LessThan(today),
        },
      }),
    ]);

    // 计算变化百分比
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? { value: 100, isUp: true } : { value: 0, isUp: false };
      }
      const change = ((current - previous) / previous) * 100;
      return {
        value: Math.abs(Math.round(change)),
        isUp: change >= 0,
      };
    };

    const trends = {
      // 公众号总数：对比今天新增 vs 昨天新增
      totalAccounts: calculateTrend(todayAddedAccounts, yesterdayAddedAccounts),
      // 文章总数：对比今天新增 vs 昨天新增
      totalArticles: calculateTrend(todayAddedArticles, yesterdayAddedArticles),
      // 未读文章：对比当前未读数 vs 昨天结束时的未读数
      unreadArticles: calculateTrend(unreadArticles, yesterdayUnreadArticles),
      // 今日新增：对比今天新增 vs 昨天新增
      todayAdded: calculateTrend(todayAddedArticles, yesterdayAddedArticles),
    };

    return {
      totalAccounts,
      totalArticles,
      unreadArticles,
      todayAdded: todayAddedArticles,
      trends,
    };
  }
}
