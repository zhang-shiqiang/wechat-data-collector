import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Article } from '../article/entities/article.entity';
import { WechatAccount } from '../account/entities/account.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(WechatAccount)
    private accountRepository: Repository<WechatAccount>,
  ) {}

  async create(userId: number, createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(userId: number): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      where: { userId },
      relations: ['parent', 'children'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    // 获取今天的开始和结束时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 为每个分类计算统计信息
    for (const category of categories) {
      category.accountCount = await this.accountRepository.count({
        where: { categoryId: category.id, userId },
      });
      category.articleCount = await this.articleRepository.count({
        where: { categoryId: category.id, userId },
      });
      // 统计今日更新的文章（基于 createdAt）
      // 注意：todayArticleCount 不在实体中定义，如果需要使用，请在实体中添加该字段
      // const todayArticleCount = await this.articleRepository
      //   .createQueryBuilder('article')
      //   .where('article.categoryId = :categoryId', { categoryId: category.id })
      //   .andWhere('article.userId = :userId', { userId })
      //   .andWhere('article.createdAt >= :today', { today })
      //   .andWhere('article.createdAt < :tomorrow', { tomorrow })
      //   .getCount();
    }

    return categories;
  }

  async findOne(id: number, userId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(
    id: number,
    userId: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id, userId);

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: number, userId: number): Promise<void> {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.remove(category);
  }

  async getTree(userId: number): Promise<Category[]> {
    const categories = await this.findAll(userId);
    const tree = this.buildTree(categories);
    
    // 递归计算子分类的统计（包含子分类的文章和公众号）
    const calculateTreeStats = (nodes: Category[]): void => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          calculateTreeStats(node.children);
          // 累加子分类的统计
          node.accountCount += node.children.reduce(
            (sum, child) => sum + (child.accountCount || 0),
            0,
          );
          node.articleCount += node.children.reduce(
            (sum, child) => sum + (child.articleCount || 0),
            0,
          );
        }
      }
    };
    
    calculateTreeStats(tree);
    return tree;
  }

  private buildTree(categories: Category[], parentId: number | null = null): Category[] {
    return categories
      .filter((category) => category.parentId === parentId)
      .map((category) => ({
        ...category,
        children: this.buildTree(categories, category.id),
      }));
  }
}

