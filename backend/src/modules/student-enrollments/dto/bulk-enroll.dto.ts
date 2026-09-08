import { IsInt, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkEnrollDto {
  @IsInt({ message: 'يجب تحديد عام دراسي صالح.' })
  @Type(() => Number)
  academic_year_id: number;

  @IsInt({ message: 'يجب تحديد شعبة دراسية صالحة.' })
  @Type(() => Number)
  class_section_id: number;

  @IsArray({ message: 'قائمة الطلاب غير صالحة أو فارغة.' })
  @ArrayMinSize(1, { message: 'قائمة الطلاب غير صالحة أو فارغة.' })
  @IsInt({ each: true, message: 'معرفات الطلاب يجب أن تكون أرقاماً صحيحة.' })
  @Type(() => Number)
  student_ids: number[];
}
