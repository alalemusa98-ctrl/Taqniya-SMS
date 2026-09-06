import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClassAcademicTermDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الصف الدراسي يجب أن يكون رقماً.' })
  class_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الفترة المرجعية يجب أن يكون رقماً.' })
  academic_term_id?: number;
}
