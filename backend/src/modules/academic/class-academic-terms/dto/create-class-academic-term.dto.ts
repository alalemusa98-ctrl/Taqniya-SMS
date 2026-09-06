import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassAcademicTermDto {
  @IsNotEmpty({ message: 'معرف الصف الدراسي مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الصف الدراسي يجب أن يكون رقماً.' })
  class_id: number;

  @IsNotEmpty({ message: 'معرف الفترة المرجعية مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الفترة المرجعية يجب أن يكون رقماً.' })
  academic_term_id: number;
}
