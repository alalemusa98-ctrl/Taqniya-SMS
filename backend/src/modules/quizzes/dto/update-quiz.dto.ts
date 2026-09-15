import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQuizDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف العام الدراسي يجب أن يكون رقماً صحيحاً' })
  academic_year_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف الفصل الدراسي يجب أن يكون رقماً صحيحاً' })
  academic_term_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف الشعبة الدراسية يجب أن يكون رقماً صحيحاً' })
  class_section_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف إسناد التدريس يجب أن يكون رقماً صحيحاً' })
  teaching_assignment_id?: number;

  @IsOptional()
  @IsString({ message: 'عنوان الاختبار يجب أن يكون نصاً' })
  @MaxLength(200, { message: 'عنوان الاختبار لا يجب أن يتجاوز 200 حرف' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'وصف ومواضيع الاختبار يجب أن يكون نصاً' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'المرفقات يجب أن تكون مصفوفة' })
  attachments?: any[];

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ إجراء الاختبار يجب أن يكون تاريخاً صالحاً ومستقبلياً.' })
  quiz_date?: string;
}
