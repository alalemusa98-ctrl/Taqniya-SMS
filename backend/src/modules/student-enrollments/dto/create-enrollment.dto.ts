import { IsInt, IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsInt({ message: 'يجب تحديد عام دراسي صالح.' })
  @Type(() => Number)
  academic_year_id: number;

  @IsInt({ message: 'يجب تحديد طالب صالح.' })
  @Type(() => Number)
  student_id: number;

  @IsInt({ message: 'يجب تحديد شعبة دراسية صالحة.' })
  @Type(() => Number)
  class_section_id: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  seating_number?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus, {
    message: 'الحالة الأكاديمية يجب أن تكون إحدى القيم: enrolled, passed, second_round, failed, graduated',
  })
  status?: EnrollmentStatus;
}
