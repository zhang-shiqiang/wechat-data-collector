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
import { WechatAccount } from '../../account/entities/account.entity';
import { Category } from '../../category/entities/category.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  accountId: number;

  @ManyToOne(() => WechatAccount, { nullable: true })
  @JoinColumn({ name: 'accountId' })
  account: WechatAccount;

  @Column({ nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  title: string;

  @Column({ type: 'longtext', nullable: true })
  content: string;

  @Column({ type: 'longtext', nullable: true })
  summary: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column()
  originalUrl: string;

  @Column({ type: 'datetime', nullable: true })
  publishTime: Date;

  @Column({ nullable: true })
  author: string;

  @Column({ default: 'unread' })
  readStatus: string; // unread/read

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ default: 0 })
  readProgress: number; // 0-100

  @Column({ nullable: true })
  readTime: number; // 分钟

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

