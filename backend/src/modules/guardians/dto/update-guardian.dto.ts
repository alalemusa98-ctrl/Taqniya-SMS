import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { GuardianRelationship } from '@prisma/client';

export class UpdateGuardianDto {
  @IsOptional()
  @IsString({ message: 'اسم ولي الأمر يجب أن يكون نصاً.' })
  @MaxLength(150, { message: 'اسم ولي الأمر يجب ألا يتجاوز 150 حرفاً.' })
  full_name?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً.' })
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يتجاوز 20 حرفاً.' })
  phone?: string;

  @IsOptional()
  @IsEnum(GuardianRelationship, {
    message: 'صلة القرابة يجب أن تكون father أو mother أو brother أو uncle أو other.',
  })
  relationship?: GuardianRelationship;

  @IsOptional()
  @IsString({ message: 'كلمة المرور يجب أن تكون نصاً.' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 خانات.' })
  password?: string;
}
