import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsNotEmpty({ message: 'العام الدراسي مطلوب' })
  @Type(() => Number)
  @IsInt({ message: 'معرف العام الدراسي يجب أن يكون رقماً صحيحاً' })
  academic_year_id!: number;

  @IsNotEmpty({ message: 'الفصل الدراسي / السمستر مطلوب' })
  @Type(() => Number)
  @IsInt({ message: 'معرف الفصل الدراسي يجب أن يكون رقماً صحيحاً' })
  academic_term_id!: number;

  @IsNotEmpty({ message: 'الشعبة الدراسية مطلوبة' })
  @Type(() => Number)
  @IsInt({ message: 'معرف الشعبة الدراسية يجب أن يكون رقماً صحيحاً' })
  class_section_id!: number;

  @IsNotEmpty({ message: 'إسناد التدريس مطلوب' })
  @Type(() => Number)
  @IsInt({ message: 'معرف إسناد التدريس يجب أن يكون رقماً صحيحاً' })
  teaching_assignment_id!: number;

  @IsNotEmpty({ message: 'عنوان الواجب مطلوب' })
  @IsString({ message: 'عنوان الواجب يجب أن يكون نصاً' })
  @MaxLength(200, { message: 'عنوان الواجب لا يجب أن يتجاوز 200 حرف' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'وصف الواجب يجب أن يكون نصاً' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'المرفقات يجب أن تكون مصفوفة' })
  attachments?: any[];

  @IsNotEmpty({ message: 'تاريخ نشر وتكليف الواجب مطلوب' })
  @IsDateString({}, { message: 'تاريخ التكليف يجب أن يكون تاريخاً صالحاً (YYYY-MM-DD)' })
  assigned_date!: string;

  @IsNotEmpty({ message: 'تاريخ استحقاق الواجب مطلوب' })
  @IsDateString({}, { message: 'تاريخ الاستحقاق يجب أن يكون تاريخاً صالحاً (YYYY-MM-DD)' })
  due_date!: string;
}
