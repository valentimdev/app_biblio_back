import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(adminId: string, dto: CreateEventDto) {
    return (this.prisma as any).event.create({
      data: {
        title: dto.title,
        description: dto.description,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        imageUrl: dto.imageUrl,
        lecturers: dto.lecturers,
        seats: dto.seats,
        isDisabled: dto.isDisabled || false,
        adminId,
      },
    });
  }

  async findAll() {
    return (this.prisma as any).event.findMany({
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await (this.prisma as any).event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return event;
  }

  async update(id: string, adminId: string, dto: UpdateEventDto) {
    const event = await this.findOne(id);
    if (event.adminId !== adminId) {
      throw new ForbiddenException('Apenas o admin criador pode editar este evento');
    }
    return (this.prisma as any).event.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string, adminId: string) {
    const event = await this.findOne(id);
    if (event.adminId !== adminId) {
      throw new ForbiddenException('Apenas o admin criador pode excluir este evento');
    }
    await (this.prisma as any).event.delete({ where: { id } });
    return { success: true };
  }

  async register(userId: string, eventId: string) {
    await this.findOne(eventId);
    return (this.prisma as any).eventRegistration.create({
      data: {
        userId,
        eventId,
      },
    });
  }

  async unregister(userId: string, eventId: string) {
    await (this.prisma as any).eventRegistration.delete({
      where: { userId_eventId: { userId, eventId } },
    });
    return { success: true };
  }

  async listRegistrations(eventId: string) {
    await this.findOne(eventId);
    return (this.prisma as any).eventRegistration.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { registeredAt: 'asc' },
    });
  }
}


