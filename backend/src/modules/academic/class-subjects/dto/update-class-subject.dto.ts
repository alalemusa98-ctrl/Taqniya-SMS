import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateClassSubjectDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف تخصيص فترة الصف يجب أن يكون رقماً.' })
  class_academic_term_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف المادة يجب أن يكون رقماً.' })
  subject_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الدرجة العظمى لأعمال السنة يجب أن تكون رقماً.' })
  @Min(0, { message: 'الدرجة العظمى لأعمال السنة لا يمكن أن تكون سالبة.' })
  max_coursework_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الدرجة العظمى للامتحان النهائي يجب أن تكون رقماً.' })
  @Min(0, { message: 'الدرجة العظمى للامتحان النهائي لا يمكن أن تكون سالبة.' })
  max_exam_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'درجة النجاح الصغرى للامتحان النهائي يجب أن تكون رقماً.' })
  @Min(0, { message: 'درجة النجاح الصغرى للامتحان لا يمكن أن تكون سالبة.' })
  exam_passing_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'درجة النجاح الإجمالية يجب أن تكون رقماً.' })
  @Min(0, { message: 'درجة النجاح الإجمالية لا يمكن أن تكون سالبة.' })
  passing_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الدرجة الكلية العظمى يجب أن تكون رقماً.' })
  @Min(1, { message: 'الدرجة الكلية العظمى يجب أن تكون أكبر من الصفر.' })
  max_score?: number;
}
