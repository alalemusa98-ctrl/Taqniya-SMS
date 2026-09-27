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

  @IsNotEmpty({ message: 'الدرجة العظمى لأعمال السنة مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'الدرجة العظمى لأعمال السنة يجب أن تكون رقماً.' })
  @Min(0, { message: 'الدرجة العظمى لأعمال السنة لا يمكن أن تكون سالبة.' })
  max_coursework_score: number;

  @IsNotEmpty({ message: 'الدرجة العظمى للامتحان النهائي مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'الدرجة العظمى للامتحان النهائي يجب أن تكون رقماً.' })
  @Min(0, { message: 'الدرجة العظمى للامتحان النهائي لا يمكن أن تكون سالبة.' })
  max_exam_score: number;

  @IsNotEmpty({ message: 'درجة النجاح الصغرى للامتحان النهائي مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'درجة النجاح الصغرى للامتحان النهائي يجب أن تكون رقماً.' })
  @Min(0, { message: 'درجة النجاح الصغرى للامتحان لا يمكن أن تكون سالبة.' })
  exam_passing_score: number;

  @IsNotEmpty({ message: 'درجة النجاح الإجمالية مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'درجة النجاح الإجمالية يجب أن تكون رقماً.' })
  @Min(0, { message: 'درجة النجاح الإجمالية لا يمكن أن تكون سالبة.' })
  passing_score: number;

  @IsNotEmpty({ message: 'الدرجة الكلية العظمى مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'الدرجة الكلية العظمى يجب أن تكون رقماً.' })
  @Min(1, { message: 'الدرجة الكلية العظمى يجب أن تكون أكبر من الصفر.' })
  max_score: number;
}
