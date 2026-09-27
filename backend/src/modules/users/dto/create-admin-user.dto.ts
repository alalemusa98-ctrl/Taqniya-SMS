import { IsString, IsNotEmpty, MinLength, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateAdminUserDto {
  @IsOptional()
  @IsString({ message: 'الرمز المؤسسي يجب أن يكون نصياً.' })
  @Matches(/^ADM-[A-Za-z0-9_-]{3,20}$/, {
    message: 'الرمز المؤسسي لمدير النظام يجب أن يبدأ بـ ADM- متبوعاً بأرقام أو أحرف (مثال: ADM-1002).',
  })
  user_code?: string;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة ولا يمكن أن تكون فارغة.' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 خانات.' })
  password: string;

  @IsOptional()
  @IsIn([0, 1], { message: 'حالة الحساب يجب أن تكون 1 (نشط) أو 0 (معطل).' })
  is_active?: number;
}
