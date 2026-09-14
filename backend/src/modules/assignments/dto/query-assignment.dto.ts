import { IsOptional, IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum AssignmentStatusFilter {
  active = 'active',
  expired = 'expired',
  all = 'all',
}

export class QueryAssignmentDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  academic_year_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  academic_term_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  class_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  class_section_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teacher_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subject_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teaching_assignment_id?: number;

  @IsOptional()
  @IsEnum(AssignmentStatusFilter)
  status?: AssignmentStatusFilter = AssignmentStatusFilter.all;

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @IsString()
  sort_by?: string = 'due_date';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
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
  @Max(50)
  per_page?: number = 15;
}
