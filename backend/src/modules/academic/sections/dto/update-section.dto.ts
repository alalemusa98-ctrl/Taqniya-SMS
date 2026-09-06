import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsString({ message: 'مسمى الشعبة يجب أن يكون نصاً' })
  @MaxLength(50, { message: 'مسمى الشعبة يجب ألا يتجاوز 50 حرفاً' })
  name?: string;
}
