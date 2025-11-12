import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendPromptDto } from './dto/send-prompt.dto';

@Controller('chat') 
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post() 
  async handleChatPrompt(
    @Body(ValidationPipe) sendPromptDto: SendPromptDto, 
  ) {
    const { prompt } = sendPromptDto;
    

    const responseText = await this.chatService.generateResponse(prompt);
    

    return {
      response: responseText,
    };
  }
}