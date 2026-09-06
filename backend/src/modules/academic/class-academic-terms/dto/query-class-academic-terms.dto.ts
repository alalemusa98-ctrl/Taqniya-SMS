import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryClassAcademicTermsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  academic_term_id?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  is_active?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  is_closed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  per_page?: number = 15;
}
