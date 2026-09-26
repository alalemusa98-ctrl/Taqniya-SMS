import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsString({ message: 'الملاحظة يجب أن تكون نصاً صالحاً' })
  @MaxLength(500, { message: 'الملاحظة لا يمكن أن تتجاوز 500 حرف' })
  note?: string;
}
