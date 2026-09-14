import { IsInt, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

export class UpdateTimetableSlotDto {
  @IsOptional()
  @IsInt({ message: 'معرف العام الدراسي يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  academic_year_id?: number;

  @IsOptional()
  @IsInt({ message: 'معرف الشعبة الدراسية يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  class_section_id?: number;

  @IsOptional()
  @IsEnum(DayOfWeek, {
    message: 'يوم الأسبوع يجب أن يكون أحد الأيام: saturday, sunday, monday, tuesday, wednesday, thursday.',
  })
  day_of_week?: DayOfWeek;

  @IsOptional()
  @IsInt({ message: 'معرف توقيت الحصة يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  period_slot_id?: number;

  @IsOptional()
  @IsInt({ message: 'معرف إسناد التدريس يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  teaching_assignment_id?: number;
}
