import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAcademicYearsDto {
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

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  is_active?: number;

  @IsOptional()
  @IsString()
  @IsIn(['id', 'name', 'start_date', 'end_date'])
  sort_by?: string = 'id';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}
