import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
} from '@nestjs/common';
import { ArticleService, ArticleQueryParams } from './article.service';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async findAll(@Request() req, @Query() query: ArticleQueryParams) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID

    const params: ArticleQueryParams = {
      author: query.author,
      accountName: query.accountName,
      title: query.title,
      categoryId: query.categoryId ? +query.categoryId : undefined,
      readStatus: query.readStatus as 'read' | 'unread' | 'all',
      isFavorite: query.isFavorite !== undefined
        ? typeof query.isFavorite === 'string'
          ? query.isFavorite === 'true'
            ? true
            : query.isFavorite === 'false'
              ? false
              : undefined
          : query.isFavorite === true
            ? true
            : query.isFavorite === false
              ? false
              : undefined
        : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy || 'publish_time',
      sortOrder: query.sortOrder || 'desc',
      page: query.page ? +query.page : 1,
      pageSize: query.pageSize ? +query.pageSize : 20,
    };

    const result = await this.articleService.findAll(userId, params);

    return {
      code: 200,
      message: '获取成功',
      data: {
        articles: result.articles,
        total: result.total,
        page: params.page,
        pageSize: params.pageSize,
      },
    };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const article = await this.articleService.findOne(+id, userId);
    return {
      code: 200,
      message: '获取成功',
      data: article,
    };
  }

  @Put(':id/read')
  async updateReadStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { readStatus: 'read' | 'unread' },
  ) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const article = await this.articleService.updateReadStatus(
      +id,
      userId,
      body.readStatus,
    );
    return {
      code: 200,
      message: '更新成功',
      data: article,
    };
  }

  @Put(':id/favorite')
  async updateFavorite(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { isFavorite: boolean },
  ) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const article = await this.articleService.updateFavorite(
      +id,
      userId,
      body.isFavorite,
    );
    return {
      code: 200,
      message: '更新成功',
      data: article,
    };
  }

  @Put(':id/progress')
  async updateProgress(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { progress: number },
  ) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const article = await this.articleService.updateProgress(
      +id,
      userId,
      body.progress,
    );
    return {
      code: 200,
      message: '更新成功',
      data: article,
    };
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    await this.articleService.delete(+id, userId);
    return {
      code: 200,
      message: '删除成功',
    };
  }
}

