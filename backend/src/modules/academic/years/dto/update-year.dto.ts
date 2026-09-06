import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';

export class UpdateAcademicYearDto {
  @IsOptional()
  @IsString({ message: 'يجب أن يكون اسم السنة الدراسية نصاً' })
  @MaxLength(50, { message: 'اسم السنة الدراسية يجب ألا يتجاوز 50 حرفاً' })
  name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'صيغة تاريخ البداية غير صالحة (YYYY-MM-DD)' })
  start_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'صيغة تاريخ النهاية غير صالحة (YYYY-MM-DD)' })
  end_date?: string;
}
