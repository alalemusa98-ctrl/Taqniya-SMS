import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @IsNotEmpty({ message: 'حقل كلمة المرور الجديدة مطلوب.' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.' })
  new_password: string;
}
