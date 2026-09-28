import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
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

  @IsOptional()
  @IsString()
  second_round_mode?: 'replace_exam' | 'full_score';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  cap_passing_score?: boolean;
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

  @IsOptional()
  @IsString()
  second_round_mode?: 'replace_exam' | 'full_score';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  cap_passing_score?: boolean;
}

export class SecondRoundSubjectGradeDto {
  @IsString({ message: 'اسم المادة يجب أن يكون نصاً.' })
  subject_name!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'درجة امتحان الدور الثاني يجب أن تكون رقماً.' })
  @Min(0, { message: 'درجة امتحان الدور الثاني لا يمكن أن تكون سالبة.' })
  second_round_exam_score!: number;
}

export class RecordSecondRoundDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  transcript_id!: number;

  @IsOptional()
  @IsString()
  second_round_mode?: 'replace_exam' | 'full_score';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  cap_passing_score?: boolean;

  @IsArray({ message: 'درجات الدور الثاني يجب أن تكون مصفوفة.' })
  @ValidateNested({ each: true })
  @Type(() => SecondRoundSubjectGradeDto)
  second_round_grades!: SecondRoundSubjectGradeDto[];
}
