import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FindTeacherAssignmentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  academic_year_id?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  per_page?: number = 15;
}
