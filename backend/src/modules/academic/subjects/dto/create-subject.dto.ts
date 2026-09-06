import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty({ message: 'اسم المادة التعليمية مطلوب' })
  @IsString({ message: 'اسم المادة يجب أن يكون نصاً' })
  @MaxLength(100, { message: 'اسم المادة يجب ألا يتجاوز 100 حرف' })
  name: string;

  @IsOptional()
  @IsString({ message: 'الكود الرمزي للمادة يجب أن يكون نصاً' })
  @MaxLength(30, { message: 'الكود الرمزي يجب ألا يتجاوز 30 حرفاً' })
  code?: string;
}
