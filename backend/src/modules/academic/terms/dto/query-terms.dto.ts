import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAcademicTermsDto {
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
  @IsString()
  @IsIn(['id', 'name', 'term_number'])
  sort_by?: string = 'term_number';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'asc';
}
