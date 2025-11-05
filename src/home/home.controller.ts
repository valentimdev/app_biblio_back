import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('home')
export class HomeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async home() {
    const events = await this.prisma.event.findMany({
      orderBy: { startTime: 'asc' },
      take: 5,
    });
    return {
      message: 'Bem-vindo',
      upcomingEvents: events,
    };
  }
}


