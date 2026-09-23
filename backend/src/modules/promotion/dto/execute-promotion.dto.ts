import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString({ message: 'الملاحظات يجب أن تكون نصاً.' })
  execution_notes?: string;
}
