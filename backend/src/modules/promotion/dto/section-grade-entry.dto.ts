import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SectionAuditProgressQueryDto {
  @IsOptional()
  @IsString()
  academic_year_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  class_academic_term_id?: number;
}

export class SectionRosterQueryDto {
  @IsOptional()
  @IsString()
  academic_year_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  class_academic_term_id?: number;
}

export class GenerateAnnualSectionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  class_section_id!: number;

  @IsOptional()
  @IsString()
  academic_year_name?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  enable_annual_exam_compensation?: boolean;
}

export class GenerateAnnualClassDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  class_id!: number;

  @IsOptional()
  @IsString()
  academic_year_name?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  enable_annual_exam_compensation?: boolean;
}
