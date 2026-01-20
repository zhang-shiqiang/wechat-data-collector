import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: '公众号名称不能为空' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '抓取方式不能为空' })
  @IsIn(['rss', 'crawl', 'api'], { message: '抓取方式必须是 rss、crawl 或 api' })
  fetchMethod: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsString()
  fakeid?: string;
}

