import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassSectionDto {
  @IsNotEmpty({ message: 'معرف الصف الدراسي مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الصف الدراسي يجب أن يكون رقماً.' })
  class_id: number;

  @IsNotEmpty({ message: 'معرف الشعبة المرجعية مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الشعبة المرجعية يجب أن يكون رقماً.' })
  section_id: number;
}
