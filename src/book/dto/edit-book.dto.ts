import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class EditBookDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  author?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  totalCopies?: number;

}
