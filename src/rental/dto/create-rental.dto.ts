import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateRentalDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  bookId: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}