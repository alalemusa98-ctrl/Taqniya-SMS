import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TranscriptType, EnrollmentStatus } from '@prisma/client';

export class QueryTranscriptsDto {
  @IsOptional()
  @IsString()
  academic_year_name?: string;

  @IsOptional()
  @IsEnum(TranscriptType)
  transcript_type?: TranscriptType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  grade_level?: number;

  @IsOptional()
  @IsString()
  class_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_section_id?: number;

  @IsOptional()
  @IsString()
  section_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_academic_term_id?: number;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  final_status?: EnrollmentStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  per_page?: number;
}
