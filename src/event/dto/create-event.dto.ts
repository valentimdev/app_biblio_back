import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  registrationStartTime?: string;

  @IsDateString()
  @IsOptional()
  registrationEndTime?: string;

  @IsDateString()
  eventStartTime: string;

  @IsDateString()
  eventEndTime: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  lecturers?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return Boolean(value);
  })
  @IsBoolean()
  @IsOptional()
  isDisabled?: boolean;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? undefined : num;
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  seats?: number;
}
