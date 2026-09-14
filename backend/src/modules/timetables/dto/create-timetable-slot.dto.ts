import { IsInt, IsNotEmpty, IsEnum, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

export class CreateTimetableSlotDto {
  @IsNotEmpty({ message: 'العام الدراسي مطلوب.' })
  @IsInt({ message: 'معرف العام الدراسي يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  academic_year_id: number;

  @IsNotEmpty({ message: 'الشعبة الدراسية مطلوبة.' })
  @IsInt({ message: 'معرف الشعبة الدراسية يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  class_section_id: number;

  @IsNotEmpty({ message: 'يوم الأسبوع مطلوب.' })
  @IsEnum(DayOfWeek, {
    message: 'يوم الأسبوع يجب أن يكون أحد الأيام: saturday, sunday, monday, tuesday, wednesday, thursday.',
  })
  day_of_week: DayOfWeek;

  @IsNotEmpty({ message: 'توقيت الحصة اليومية مطلوب.' })
  @IsInt({ message: 'معرف توقيت الحصة يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  period_slot_id: number;

  @IsNotEmpty({ message: 'إسناد التدريس مطلوب.' })
  @IsInt({ message: 'معرف إسناد التدريس يجب أن يكون رقماً صحيحاً.' })
  @IsPositive()
  @Type(() => Number)
  teaching_assignment_id: number;
}
