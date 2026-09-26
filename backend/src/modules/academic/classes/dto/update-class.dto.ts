import { IsOptional, IsString, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClassDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف المرحلة الدراسية يجب أن يكون رقماً صحيحاً' })
  stage_id?: number;

  @IsOptional()
  @IsString({ message: 'اسم الصف يجب أن يكون نصاً' })
  @MaxLength(50, { message: 'اسم الصف يجب ألا يتجاوز 50 حرفاً' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'المستوى الأكاديمي يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'المستوى الأكاديمي يجب أن يكون 1 على الأقل' })
  @Max(12, { message: 'المستوى الأكاديمي يجب ألا يتجاوز 12' })
  grade_level?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الحد الأقصى لمواد الدور الثاني يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'الحد الأقصى لمواد الدور الثاني لا يمكن أن يكون سالباً' })
  max_second_round_subjects?: number;
}
