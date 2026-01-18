import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const category = await this.categoryService.create(userId, createCategoryDto);
    return {
      code: 200,
      message: '创建成功',
      data: category,
    };
  }

  @Get()
  async findAll(@Request() req) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const categories = await this.categoryService.findAll(userId);
    return {
      code: 200,
      message: '获取成功',
      data: categories,
    };
  }

  @Get('tree')
  async getTree(@Request() req) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const tree = await this.categoryService.getTree(userId);
    return {
      code: 200,
      message: '获取成功',
      data: tree,
    };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const category = await this.categoryService.findOne(+id, userId);
    return {
      code: 200,
      message: '获取成功',
      data: category,
    };
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const category = await this.categoryService.update(+id, userId, updateCategoryDto);
    return {
      code: 200,
      message: '更新成功',
      data: category,
    };
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    await this.categoryService.remove(+id, userId);
    return {
      code: 200,
      message: '删除成功',
    };
  }
}

