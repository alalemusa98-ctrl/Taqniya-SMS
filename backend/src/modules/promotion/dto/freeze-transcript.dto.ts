import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranscriptType, EnrollmentStatus } from '@prisma/client';

export class FreezeTranscriptDto {
  @IsNotEmpty({ message: 'معرف الطالب مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف الطالب يجب أن يكون رقماً صحيحاً.' })
  student_id: number;

  @IsNotEmpty({ message: 'نوع الصحيفة مطلوب.' })
  @IsEnum(TranscriptType, { message: 'نوع الصحيفة يجب أن يكون term أو annual.' })
  transcript_type: TranscriptType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'معرف فترة الصف يجب أن يكون رقماً صحيحاً.' })
  class_academic_term_id?: number;

  @IsNotEmpty({ message: 'اسم العام الدراسي مطلوب.' })
  @IsString({ message: 'اسم العام الدراسي يجب أن يكون نصاً.' })
  academic_year_name: string;

  @IsNotEmpty({ message: 'اسم الصف الدراسي مطلوب.' })
  @IsString({ message: 'اسم الصف الدراسي يجب أن يكون نصاً.' })
  class_name: string;

  @IsNotEmpty({ message: 'اسم الشعبة مطلوب.' })
  @IsString({ message: 'اسم الشعبة يجب أن يكون نصاً.' })
  section_name: string;

  @IsNotEmpty({ message: 'المستوى الأكاديمي مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'المستوى الأكاديمي يجب أن يكون رقماً.' })
  grade_level: number;

  @IsNotEmpty({ message: 'المجموع الكلي مطلوب.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'المجموع الكلي يجب أن يكون قيمة رقمية صالحة.' })
  total_score: number;

  @IsNotEmpty({ message: 'النسبة المئوية مطلوبة.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'النسبة المئوية يجب أن تكون قيمة رقمية صالحة.' })
  percentage: number;

  @IsNotEmpty({ message: 'القرار والنتيجة النهائية مطلوبة.' })
  @IsEnum(EnrollmentStatus, {
    message: 'النتيجة النهائية يجب أن تكون passed, second_round, failed, أو graduated.',
  })
  final_status: EnrollmentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'الترتيب يجب أن يكون رقماً.' })
  rank?: number;

  @IsNotEmpty({ message: 'بيانات درجات المواد مطلوبة ويجب أن تكون مصفوفة صالحة.' })
  @IsObject({ message: 'بيانات درجات المواد مطلوبة ويجب أن تكون كائناً أو مصفوفة صالحة.' })
  transcript_data: any;
}
