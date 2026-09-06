import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryClassesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stage_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  grade_level?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort_by?: string = 'grade_level';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  per_page?: number = 15;
}
