import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from '@prisma/client';

export class FindEnrollmentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  academic_year_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  class_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  class_section_id?: number;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
