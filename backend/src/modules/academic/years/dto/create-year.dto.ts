import { IsNotEmpty, IsString, MaxLength, IsDateString } from 'class-validator';

export class CreateAcademicYearDto {
  @IsNotEmpty({ message: 'اسم السنة الدراسية مطلوب' })
  @IsString({ message: 'يجب أن يكون اسم السنة الدراسية نصاً' })
  @MaxLength(50, { message: 'اسم السنة الدراسية يجب ألا يتجاوز 50 حرفاً' })
  name: string;

  @IsNotEmpty({ message: 'تاريخ بداية السنة مطلوب' })
  @IsDateString({}, { message: 'صيغة تاريخ البداية غير صالحة (YYYY-MM-DD)' })
  start_date: string;

  @IsNotEmpty({ message: 'تاريخ نهاية السنة مطلوب' })
  @IsDateString({}, { message: 'صيغة تاريخ النهاية غير صالحة (YYYY-MM-DD)' })
  end_date: string;
}
