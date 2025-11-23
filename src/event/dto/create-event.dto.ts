import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isDisabled?: boolean;

  @IsOptional()
  seats?: number;
}


