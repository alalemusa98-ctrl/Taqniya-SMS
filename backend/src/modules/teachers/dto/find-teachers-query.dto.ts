import { IsOptional, IsString, IsIn } from 'class-validator';

export class FindTeachersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  is_active?: string | number;

  @IsOptional()
  @IsIn(['id', 'full_name', 'user_code', 'hire_date'])
  sort_by?: 'id' | 'full_name' | 'user_code' | 'hire_date' = 'id';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  page?: string | number = 1;

  @IsOptional()
  per_page?: string | number = 15;
}
