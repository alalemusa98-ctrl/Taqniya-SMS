import {
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePeriodSlotDto {
  @IsOptional()
  @IsString({ message: 'مسمى الحصة يجب أن يكون نصاً.' })
  @MaxLength(50, { message: 'مسمى الحصة لا يجب أن يتجاوز 50 حرفاً.' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الرقم التسلسلي للحصة يجب أن يكون رقماً صحيحاً موجباً.' })
  @Min(1, { message: 'الرقم التسلسلي للحصة يجب أن يكون رقماً صحيحاً موجباً.' })
  @Max(255, { message: 'الرقم التسلسلي للحصة لا يجب أن يتجاوز 255.' })
  slot_number?: number;

  @IsOptional()
  @IsString({ message: 'وقت بداية الحصة يجب أن يكون بصيغة HH:mm:ss أو HH:mm.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'وقت بداية الحصة غير صالح. الصيغة المطلوبة HH:mm:ss أو HH:mm.',
  })
  start_time?: string;

  @IsOptional()
  @IsString({ message: 'وقت نهاية الحصة يجب أن يكون بصيغة HH:mm:ss أو HH:mm.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'وقت نهاية الحصة غير صالح. الصيغة المطلوبة HH:mm:ss أو HH:mm.',
  })
  end_time?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'قيمة فترة الاستراحة يجب أن تكون 0 أو 1.' })
  is_break?: number;
}
