// src/chat/chat.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não foi encontrada nas variáveis de ambiente');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = `
      Você é o 'Biblio Bot', o assistente virtual da biblioteca.
      Sua personalidade é prestativa, paciente e amigável.
      Sua única função é responder perguntas sobre a biblioteca da UNIFOR(Universidade de Fortaleza) e seus serviços.
      Evite fornecer informações incorretas ou inventadas.
      Se você não souber a resposta para uma pergunta, responda educadamente que não sabe, em vez de tentar adivinhar.
      Mantenha a resposta concisa e evite respostas longas demais.
      No máximo use 300 caracteres por resposta.
    `;
    
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: systemInstruction,

      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }


  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return text;

    } catch (error) {
      console.error('Erro ao chamar a API do Gemini:', error);
      throw new InternalServerErrorException('Falha ao obter resposta da IA');
    }
  }
}