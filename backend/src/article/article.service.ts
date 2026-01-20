import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Article } from './entities/article.entity';

export interface ArticleQueryParams {
  author?: string;
  accountName?: string;
  title?: string;
  categoryId?: number;
  readStatus?: 'read' | 'unread' | 'all';
  isFavorite?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: 'publish_time' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async create(articleData: Partial<Article>): Promise<Article> {
    // 清理 undefined 值，但保留 null 值（用于可空字段）
    const cleanedData: any = {};
    for (const key in articleData) {
      if (articleData[key] !== undefined) {
        cleanedData[key] = articleData[key];
      }
    }
    const article = this.articleRepository.create(cleanedData);
    const saved = await this.articleRepository.save(article);
    // save 可能返回数组，确保返回单个对象
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async createBatch(articlesData: Partial<Article>[]): Promise<Article[]> {
    const articles = this.articleRepository.create(articlesData);
    return await this.articleRepository.save(articles);
  }

  async findOne(id: number, userId: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id, userId },
      relations: ['account', 'category'],
    });

    if (!article) {
      throw new Error('文章不存在');
    }

    return article;
  }

  async findAll(
    userId: number,
    params: ArticleQueryParams,
  ): Promise<{ articles: Article[]; total: number }> {
    const {
      author,
      accountName,
      title,
      categoryId,
      readStatus,
      isFavorite,
      startDate,
      endDate,
      sortBy = 'publish_time',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20,
    } = params;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.account', 'account')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.userId = :userId', { userId });

    // 作者筛选
    if (author) {
      queryBuilder.andWhere('article.author LIKE :author', {
        author: `%${author}%`,
      });
    }

    // 公众号名称筛选
    if (accountName) {
      queryBuilder.andWhere('account.name LIKE :accountName', {
        accountName: `%${accountName}%`,
      });
    }

    // 标题筛选
    if (title) {
      queryBuilder.andWhere('article.title LIKE :title', {
        title: `%${title}%`,
      });
    }

    // 分类筛选
    if (categoryId) {
      queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    // 阅读状态筛选
    if (readStatus && readStatus !== 'all') {
      queryBuilder.andWhere('article.readStatus = :readStatus', {
        readStatus,
      });
    }

    // 收藏筛选
    if (isFavorite !== undefined) {
      queryBuilder.andWhere('article.isFavorite = :isFavorite', {
        isFavorite,
      });
    }

    // 日期范围筛选
    if (startDate) {
      queryBuilder.andWhere('article.publishTime >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      queryBuilder.andWhere('article.publishTime <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    // 排序
    const sortField =
      sortBy === 'publish_time'
        ? 'article.publishTime'
        : sortBy === 'created_at'
          ? 'article.createdAt'
          : 'article.title';
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [articles, total] = await queryBuilder.getManyAndCount();

    return { articles, total };
  }

  async findByAccount(accountId: number, userId: number): Promise<Article[]> {
    return await this.articleRepository.find({
      where: { accountId, userId },
      relations: ['account', 'category'],
      order: { publishTime: 'DESC' },
    });
  }

  async countByAccount(accountId: number, userId: number): Promise<number> {
    return await this.articleRepository.count({
      where: { accountId, userId },
    });
  }

  async countUnreadByAccount(
    accountId: number,
    userId: number,
  ): Promise<number> {
    return await this.articleRepository.count({
      where: { accountId, userId, readStatus: 'unread' },
    });
  }

  async findByOriginalUrl(
    originalUrl: string,
    accountId?: number,
  ): Promise<Article | null> {
    if (accountId !== undefined) {
      return await this.articleRepository.findOne({
        where: { originalUrl, accountId },
      });
    } else {
      // 如果没有指定 accountId，检查 originalUrl 且 accountId 为 null 的文章
      return await this.articleRepository.findOne({
        where: { originalUrl, accountId: null },
      });
    }
  }

  async updateReadStatus(
    id: number,
    userId: number,
    readStatus: 'read' | 'unread',
  ): Promise<Article> {
    const article = await this.findOne(id, userId);
    article.readStatus = readStatus;
    return await this.articleRepository.save(article);
  }

  async updateFavorite(
    id: number,
    userId: number,
    isFavorite: boolean,
  ): Promise<Article> {
    const article = await this.findOne(id, userId);
    article.isFavorite = isFavorite;
    return await this.articleRepository.save(article);
  }

  async updateProgress(
    id: number,
    userId: number,
    progress: number,
  ): Promise<Article> {
    const article = await this.findOne(id, userId);
    article.readProgress = progress;
    if (progress >= 100) {
      article.readStatus = 'read';
    }
    return await this.articleRepository.save(article);
  }

  async delete(id: number, userId: number): Promise<void> {
    const article = await this.findOne(id, userId);
    await this.articleRepository.remove(article);
  }

  /**
   * 清空所有文章数据
   */
  async deleteAll(userId: number): Promise<number> {
    const result = await this.articleRepository.delete({ userId });
    return result.affected || 0;
  }

  /**
   * 批量查找已存在的文章（根据 originalUrl 列表）
   */
  async findExistingByUrls(
    originalUrls: string[],
    accountId?: number,
  ): Promise<Map<string, Article>> {
    if (originalUrls.length === 0) {
      return new Map();
    }

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .where('article.originalUrl IN (:...urls)', { urls: originalUrls });

    if (accountId !== undefined) {
      queryBuilder.andWhere('article.accountId = :accountId', { accountId });
    }

    const existingArticles = await queryBuilder.getMany();
    const urlMap = new Map<string, Article>();
    existingArticles.forEach((article) => {
      urlMap.set(article.originalUrl, article);
    });

    return urlMap;
  }
}

