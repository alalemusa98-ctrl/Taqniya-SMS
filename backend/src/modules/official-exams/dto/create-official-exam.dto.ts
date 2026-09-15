import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from '@prisma/client';

export class ExamAttachmentDto {
  @IsNotEmpty({ message: 'اسم الملف مطلوب.' })
  @IsString({ message: 'اسم الملف يجب أن يكون نصاً.' })
  file_name: string;

  @IsNotEmpty({ message: 'رابط الملف مطلوب.' })
  @IsString({ message: 'رابط الملف يجب أن يكون نصاً صالحاً.' })
  file_url: string;

  @IsNotEmpty({ message: 'نوع الملف مطلوب.' })
  @IsString({ message: 'نوع الملف يجب أن يكون نصاً.' })
  file_type: string;

  @IsOptional()
  @IsInt({ message: 'حجم الملف يجب أن يكون رقماً صحيحاً بالبايت.' })
  file_size?: number;
}

export class CreateOfficialExamDto {
  @IsNotEmpty({ message: 'معرف العام الدراسي مطلوب.' })
  @Type(() => Number)
  @IsInt({ message: 'معرف العام الدراسي يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  academic_year_id: number;

  @IsNotEmpty({ message: 'معرف الفصل الدراسي مطلوب.' })
  @Type(() => Number)
  @IsInt({ message: 'معرف الفصل الدراسي يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  academic_term_id: number;

  @IsNotEmpty({ message: 'معرف الصف الدراسي مطلوب.' })
  @Type(() => Number)
  @IsInt({ message: 'معرف الصف الدراسي يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  class_id: number;

  @IsNotEmpty({ message: 'معرف المادة الدراسية مطلوب.' })
  @Type(() => Number)
  @IsInt({ message: 'معرف المادة الدراسية يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  subject_id: number;

  @IsNotEmpty({ message: 'نوع الامتحان الرسمي مطلوب.' })
  @IsEnum(ExamType, {
    message: 'نوع الامتحان يجب أن يكون midterm أو final أو second_round.',
  })
  exam_type: ExamType;

  @IsNotEmpty({ message: 'تاريخ يوم الامتحان مطلوب.' })
  @IsDateString({}, { message: 'تاريخ الامتحان يجب أن يكون بصيغة YYYY-MM-DD صالحة.' })
  exam_date: string;

  @IsOptional()
  @IsString({ message: 'التعليمات والإرشادات يجب أن تكون نصاً.' })
  @MaxLength(255, { message: 'التعليمات يجب ألا تتجاوز 255 حرفاً.' })
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'المرفقات يجب أن تكون مصفوفة صالحة.' })
  @ValidateNested({ each: true })
  @Type(() => ExamAttachmentDto)
  attachments?: ExamAttachmentDto[];
}
