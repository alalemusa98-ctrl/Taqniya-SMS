import { IsNotEmpty, IsString, MaxLength, IsOptional, MinLength, Matches, IsDateString } from 'class-validator';

export class CreateTeacherDto {
  @IsNotEmpty({ message: 'الاسم الرباعي واللقب للمعلم مطلوب.' })
  @IsString({ message: 'اسم المعلم يجب أن يكون نصاً.' })
  @MaxLength(150, { message: 'اسم المعلم يجب ألا يتجاوز 150 حرفاً.' })
  full_name: string;

  @IsOptional()
  @IsString({ message: 'رمز المعلم يجب أن يكون نصاً.' })
  @MaxLength(30, { message: 'رمز المعلم يجب ألا يتجاوز 30 حرفاً.' })
  user_code?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً.' })
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يتجاوز 20 حرفاً.' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'التخصص العلمي يجب أن يكون نصاً.' })
  @MaxLength(100, { message: 'التخصص العلمي يجب ألا يتجاوز 100 حرف.' })
  specialization?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ التعيين يجب أن يكون تاريخاً صالحاً (YYYY-MM-DD).' })
  hire_date?: string;

  @IsNotEmpty({ message: 'كلمة مرور الحساب الموحد مطلوبة عند الإنشاء.' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 خانات وتحتوي على أرقام وحروف.' })
  password: string;
}
