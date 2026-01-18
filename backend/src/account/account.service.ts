import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WechatAccount } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ArticleService } from '../article/article.service';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(WechatAccount)
    private accountRepository: Repository<WechatAccount>,
    private articleService: ArticleService,
  ) {}

  async create(userId: number, createAccountDto: CreateAccountDto): Promise<WechatAccount> {
    const account = this.accountRepository.create({
      ...createAccountDto,
      userId,
    });

    return await this.accountRepository.save(account);
  }

  async findAll(userId: number, categoryId?: number): Promise<WechatAccount[]> {
    const where: any = { userId };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return await this.accountRepository.find({
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<WechatAccount> {
    const account = await this.accountRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!account) {
      throw new NotFoundException('公众号不存在');
    }

    return account;
  }

  async update(
    id: number,
    userId: number,
    updateAccountDto: UpdateAccountDto,
  ): Promise<WechatAccount> {
    const account = await this.findOne(id, userId);

    Object.assign(account, updateAccountDto);
    return await this.accountRepository.save(account);
  }

  async remove(id: number, userId: number): Promise<void> {
    const account = await this.findOne(id, userId);
    await this.accountRepository.remove(account);
  }

  async removeBatch(ids: number[], userId: number): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: ids.map((id) => ({ id, userId })),
    });
    await this.accountRepository.remove(accounts);
  }

  /**
   * 更新公众号的文章统计
   */
  async updateArticleStats(accountId: number, userId: number): Promise<void> {
    const account = await this.findOne(accountId, userId);
    const articleCount = await this.articleService.countByAccount(
      accountId,
      userId,
    );
    const unreadCount = await this.articleService.countUnreadByAccount(
      accountId,
      userId,
    );

    account.articleCount = articleCount;
    account.unreadCount = unreadCount;
    account.lastFetchTime = new Date();

    await this.accountRepository.save(account);
  }
}

