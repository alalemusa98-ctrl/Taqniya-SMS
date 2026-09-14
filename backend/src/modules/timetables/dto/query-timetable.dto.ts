import { IsOptional, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTimetableDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  academic_year_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  class_id?: number;
}
