import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FindTeachingAssignmentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  academic_year_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_section_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  teacher_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subject_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  per_page?: number = 15;
}
