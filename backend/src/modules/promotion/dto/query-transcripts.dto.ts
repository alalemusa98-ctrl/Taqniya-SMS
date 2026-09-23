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
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : Number(value)))
  @IsNumber()
  grade_level?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsString()
  class_name?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : Number(value)))
  @IsNumber()
  class_id?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : Number(value)))
  @IsNumber()
  class_section_id?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsString()
  section_name?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : Number(value)))
  @IsNumber()
  class_academic_term_id?: number;

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
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 20))
  @IsNumber()
  per_page?: number;
}
