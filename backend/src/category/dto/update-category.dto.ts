import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  parentId?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}

