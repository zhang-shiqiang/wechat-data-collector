import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: '公众号名称不能为空' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '抓取方式不能为空' })
  @IsIn(['rss', 'crawl', 'api'], { message: '抓取方式必须是 rss、crawl 或 api' })
  fetchMethod: string;
}

