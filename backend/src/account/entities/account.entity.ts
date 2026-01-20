import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';

@Entity('wechat_accounts')
export class WechatAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  alias: string;

  @Column({ nullable: true })
  wechatId: string;

  @Column({ nullable: true })
  fakeid: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  rssUrl: string;

  @Column({ nullable: true })
  fetchUrl: string;

  @Column({ default: 'crawl' })
  fetchMethod: string; // rss/crawl/api

  @Column({ default: true })
  fetchEnabled: boolean;

  @Column({ default: 24 })
  fetchFrequency: number; // 小时

  @Column({ type: 'json', nullable: true })
  fetchFilters: {
    author?: string;
    titleKeywords?: string;
    matchMode?: string;
    dateRange?: { start?: string; end?: string };
  };

  @Column({ nullable: true })
  lastFetchTime: Date;

  @Column({ default: 0 })
  articleCount: number;

  @Column({ default: 0 })
  unreadCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

