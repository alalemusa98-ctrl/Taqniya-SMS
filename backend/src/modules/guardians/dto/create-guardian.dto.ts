import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { GuardianRelationship } from '@prisma/client';

export class CreateGuardianDto {
  @IsNotEmpty({ message: 'الاسم الكامل لولي الأمر مطلوب.' })
  @IsString({ message: 'اسم ولي الأمر يجب أن يكون نصاً.' })
  @MaxLength(150, { message: 'اسم ولي الأمر يجب ألا يتجاوز 150 حرفاً.' })
  full_name: string;

  @IsNotEmpty({ message: 'رقم هاتف التواصل مع ولي الأمر مطلوب.' })
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً.' })
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يتجاوز 20 حرفاً.' })
  phone: string;

  @IsOptional()
  @IsEnum(GuardianRelationship, {
    message: 'صلة القرابة يجب أن تكون father أو mother أو brother أو uncle أو other.',
  })
  relationship?: GuardianRelationship = GuardianRelationship.father;

  @IsNotEmpty({ message: 'كلمة المرور مطلوبة عند إنشاء حساب ولي الأمر.' })
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 خانات.' })
  password: string;
}
