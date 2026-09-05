import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsInt({ message: 'قيمة حالة التفعيل يجب أن تكون 1 أو 0.' })
  @IsIn([0, 1], { message: 'حالة التفعيل يجب أن تكون 1 (نشط) أو 0 (معطل).' })
  is_active: number;

  @IsOptional()
  @IsString({ message: 'سبب تغيير الحالة يجب أن يكون نصاً.' })
  reason?: string;
}
