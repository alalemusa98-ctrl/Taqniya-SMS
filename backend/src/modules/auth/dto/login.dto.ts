import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'حقل الرمز المؤسسي مطلوب.' })
  @IsString({ message: 'الرمز المؤسسي يجب أن يكون نصاً.' })
  @Matches(/^(ADM|TCH|STU|PAR)-\d{4,}$/, {
    message: 'الرمز المؤسسي غير صالح. النمط المتوقع: ADM-XXXX أو TCH-XXXX أو STU-XXXX أو PAR-XXXX.',
  })
  user_code: string;

  @IsNotEmpty({ message: 'حقل كلمة المرور مطلوب.' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف.' })
  password: string;

  @IsOptional()
  @IsString()
  device_name?: string;
}
