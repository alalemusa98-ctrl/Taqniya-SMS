import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
}
