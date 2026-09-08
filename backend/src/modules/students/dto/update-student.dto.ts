import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsDateString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export class UpdateStudentDto {
  @IsOptional()
  @IsString({ message: 'اسم الطالب يجب أن يكون نصاً.' })
  @MaxLength(150, { message: 'اسم الطالب يجب ألا يتجاوز 150 حرفاً.' })
  full_name?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'الجنس يجب أن يكون إما male أو female.' })
  gender?: Gender;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً.' })
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يتجاوز 20 حرفاً.' })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الميلاد يجب أن يكون بصيغة صالحة (YYYY-MM-DD).' })
  birth_date?: string;

  @IsOptional()
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 خانات.' })
  password?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف الشعبة الدراسية يجب أن يكون رقماً صحيحاً.' })
  class_section_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف العام الدراسي يجب أن يكون رقماً صحيحاً.' })
  academic_year_id?: number;

  @IsOptional()
  @IsString({ message: 'رقم الجلوس يجب أن يكون نصاً.' })
  @MaxLength(50, { message: 'رقم الجلوس يجب ألا يتجاوز 50 حرفاً.' })
  seating_number?: string;
}
