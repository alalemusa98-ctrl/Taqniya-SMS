import { IsOptional, IsString, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAcademicStageDto {
  @IsOptional()
  @IsString({ message: 'يجب أن يكون اسم المرحلة نصاً' })
  @MaxLength(50, { message: 'اسم المرحلة يجب ألا يتجاوز 50 حرفاً' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ترتيب المرحلة يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'ترتيب المرحلة يجب أن يكون 1 على الأقل' })
  order_index?: number;
}
