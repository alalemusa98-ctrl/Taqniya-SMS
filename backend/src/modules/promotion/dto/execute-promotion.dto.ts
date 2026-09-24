import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ExecutePromotionDto {
  @IsNotEmpty({ message: 'العام الدراسي المرحل منه مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف العام الدراسي المرحل منه يجب أن يكون رقماً.' })
  from_academic_year_id: number;

  @IsNotEmpty({ message: 'العام الدراسي المرحل إليه مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف العام الدراسي المرحل إليه يجب أن يكون رقماً.' })
  to_academic_year_id: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean({ message: 'ميزة التعويض السنوي للامتحان يجب أن تكون قيمة منطقية.' })
  enable_annual_exam_compensation?: boolean;

  @IsOptional()
  @IsString({ message: 'الملاحظات يجب أن تكون نصاً.' })
  execution_notes?: string;
}
