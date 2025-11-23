import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

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
  @IsOptional()
  eventStartTime?: string;

  @IsDateString()
  @IsOptional()
  eventEndTime?: string;


  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  lecturers?: string;

  @IsBoolean()
  @IsOptional()
  isDisabled?: boolean;

  @IsOptional()
  seats?: number;
}