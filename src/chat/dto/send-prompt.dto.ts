import { IsNotEmpty, IsString } from 'class-validator';

export class SendPromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}