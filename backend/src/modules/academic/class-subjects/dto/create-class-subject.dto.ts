import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClassSubjectDto {
  @IsNotEmpty({ message: 'معرف تخصيص فترة الصف مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف تخصيص فترة الصف يجب أن يكون رقماً.' })
  class_academic_term_id: number;

  @IsNotEmpty({ message: 'معرف المادة العامة مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف المادة يجب أن يكون رقماً.' })
  subject_id: number;

  @IsNotEmpty({ message: 'درجة النجاح مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'درجة النجاح يجب أن تكون رقماً.' })
  @Min(0, { message: 'درجة النجاح لا يمكن أن تكون سالبة.' })
  passing_score: number;

  @IsNotEmpty({ message: 'الدرجة العظمى مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'الدرجة العظمى يجب أن تكون رقماً.' })
  @Min(1, { message: 'الدرجة العظمى يجب أن تكون أكبر من الصفر.' })
  max_score: number;
}
