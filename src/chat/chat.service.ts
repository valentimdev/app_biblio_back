// src/chat/chat.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai'; // Importe a biblioteca da OpenAI

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private systemInstructionText: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY não foi encontrada nas variáveis de ambiente',
      );
    }

    this.openai = new OpenAI({ apiKey });

    this.systemInstructionText = `
      Você é o 'Biblio Bot', o assistente virtual da biblioteca.
      Sua personalidade é prestativa, paciente e amigável.
      Sua única função é responder perguntas sobre a biblioteca da UNIFOR(Universidade de Fortaleza) e seus serviços.
      Evite fornecer informações incorretas ou inventadas.
      Se você não souber a resposta para uma pergunta, responda educadamente que não sabe, em vez de tentar adivinhar.
      Mantenha a resposta concisa e evite respostas longas demais.
      No máximo use 300 caracteres por resposta.
    `;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',

        messages: [
          {
            role: 'system',
            content: this.systemInstructionText,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
      });

      const responseText = chatCompletion.choices?.[0]?.message?.content;
      if (responseText) {
        return responseText.trim();
      }
      console.error('Resposta da OpenAI não continha texto:', chatCompletion);
      throw new InternalServerErrorException(
        'A IA retornou uma resposta vazia ou inválida',
      );
    } catch (error) {
      console.error('Erro ao chamar a API da OpenAI:', error);
      throw new InternalServerErrorException('Falha ao obter resposta da IA');
    }
  }
}
