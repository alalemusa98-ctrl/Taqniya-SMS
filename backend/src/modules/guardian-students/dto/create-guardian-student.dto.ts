import { IsNotEmpty, IsInt, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGuardianStudentDto {
  @IsNotEmpty({ message: 'معرف ولي الأمر مطلوب.' })
  @Type(() => Number)
  @IsInt({ message: 'معرف ولي الأمر يجب أن يكون رقماً صحيحاً.' })
  guardian_id: number;

  @IsNotEmpty({ message: 'معرف الطالب مطلوب.' })
  @Type(() => Number)
  @IsInt({ message: 'معرف الطالب يجب أن يكون رقماً صحيحاً.' })
  student_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1], { message: 'صفة الوصي الأساسي يجب أن تكون 1 (نعم) أو 0 (لا).' })
  is_primary?: number = 1;
}
