import {
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['rss', 'crawl', 'api'], { message: '抓取方式必须是 rss、crawl 或 api' })
  fetchMethod?: string;
}

