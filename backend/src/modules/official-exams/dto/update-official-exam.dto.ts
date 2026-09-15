import {
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
import { ExamAttachmentDto } from './create-official-exam.dto.js';

export class UpdateOfficialExamDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف العام الدراسي يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  academic_year_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف الفصل الدراسي يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  academic_term_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف الصف الدراسي يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  class_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف المادة الدراسية يجب أن يكون رقماً صحيحاً.' })
  @Min(1)
  subject_id?: number;

  @IsOptional()
  @IsEnum(ExamType, {
    message: 'نوع الامتحان يجب أن يكون midterm أو final أو second_round.',
  })
  exam_type?: ExamType;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الامتحان يجب أن يكون بصيغة YYYY-MM-DD صالحة.' })
  exam_date?: string;

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
