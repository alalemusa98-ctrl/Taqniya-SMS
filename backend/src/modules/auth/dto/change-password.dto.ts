import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'حقل كلمة المرور الحالية مطلوب.' })
  @IsString({ message: 'كلمة المرور الحالية يجب أن تكون نصاً.' })
  current_password: string;

  @IsNotEmpty({ message: 'حقل كلمة المرور الجديدة مطلوب.' })
  @IsString({ message: 'كلمة المرور الجديدة يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.' })
  new_password: string;

  @IsNotEmpty({ message: 'حقل تأكيد كلمة المرور الجديدة مطلوب.' })
  @IsString({ message: 'تأكيد كلمة المرور يجب أن يكون نصاً.' })
  new_password_confirmation: string;
}
