import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TranscriptType, EnrollmentStatus } from '@prisma/client';

export class QueryTranscriptsDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsString()
  academic_year_name?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsEnum(TranscriptType)
  transcript_type?: TranscriptType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  grade_level?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsString()
  class_name?: string;

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
  section_id?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsString()
  section_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class_academic_term_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  academic_term_id?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsEnum(EnrollmentStatus)
  final_status?: EnrollmentStatus;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  sort_by?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
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
