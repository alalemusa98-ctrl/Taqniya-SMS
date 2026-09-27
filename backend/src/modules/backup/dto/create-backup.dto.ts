import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export type BackupType = 'full' | 'database' | 'files';

export class CreateBackupDto {
  @IsOptional()
  @IsIn(['full', 'database', 'files'], { message: 'نوع النسخة الاحتياطية يجب أن يكون full أو database أو files' })
  type?: BackupType = 'full';

  @IsOptional()
  @IsString({ message: 'الملاحظة يجب أن تكون نصاً صالحاً' })
  @MaxLength(500, { message: 'الملاحظة لا يمكن أن تتجاوز 500 حرف' })
  note?: string;
}
