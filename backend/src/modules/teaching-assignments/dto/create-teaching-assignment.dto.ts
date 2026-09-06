import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeachingAssignmentDto {
  @IsNotEmpty({ message: 'العام الدراسي مطلوب' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف العام الدراسي يجب أن يكون رقماً' })
  academic_year_id!: number;

  @IsNotEmpty({ message: 'الشعبة الدراسية مطلوبة' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الشعبة الدراسية يجب أن يكون رقماً' })
  class_section_id!: number;

  @IsNotEmpty({ message: 'المادة التعليمية مطلوبة' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف المادة التعليمية يجب أن يكون رقماً' })
  subject_id!: number;

  @IsNotEmpty({ message: 'المعلم المكلف مطلوب' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف المعلم المكلف يجب أن يكون رقماً' })
  teacher_id!: number;
}
