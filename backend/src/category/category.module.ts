import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from './entities/category.entity';
import { Article } from '../article/entities/article.entity';
import { WechatAccount } from '../account/entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Article, WechatAccount])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}

