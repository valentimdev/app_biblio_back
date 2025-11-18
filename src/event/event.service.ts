import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    adminId: string,
    dto: CreateEventDto,
    image?: Express.Multer.File,
  ) {
    let imageUrl = dto.imageUrl;

    // Upload image if provided
    if (image) {
      imageUrl = await this.storageService.uploadFile(image, 'events');
    }

    return (this.prisma as any).event.create({
      data: {
        title: dto.title,
        description: dto.description,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        imageUrl,
        lecturers: dto.lecturers,
        seats: dto.seats,
        isDisabled: dto.isDisabled || false,
        adminId,
      },
    });
  }

  async findAll() {
    const events = await (this.prisma as any).event.findMany({
      include: {
        registrations: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return events.map((event) => ({
      ...event,
      registeredUsers: event.registrations.map((reg) => reg.user),
      registrations: undefined,
    }));
  }

  async findOne(id: string) {
    const event = await (this.prisma as any).event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');

    const eventWithUsers = {
      ...event,
      registeredUsers: event.registrations.map((reg) => reg.user),
      registrations: undefined,
    };

    return eventWithUsers;
  }

  async update(
    id: string,
    adminId: string,
    dto: UpdateEventDto,
    image?: Express.Multer.File,
  ) {
    const event = await this.findOne(id);
    if (event.adminId !== adminId) {
      throw new ForbiddenException(
        'Apenas o admin criador pode editar este evento',
      );
    }

    const updateData: any = { ...dto };

    // Upload new image if provided
    if (image) {
      // Delete old image if exists
      if (event.imageUrl) {
        await this.storageService.deleteFileByUrl(event.imageUrl);
      }
      updateData.imageUrl = await this.storageService.uploadFile(
        image,
        'events',
      );
    } else if (dto.imageUrl !== undefined) {
      // If imageUrl is explicitly set in DTO (including null to remove), use it
      updateData.imageUrl = dto.imageUrl;
    }

    return (this.prisma as any).event.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, adminId: string) {
    const event = await this.findOne(id);
    if (event.adminId !== adminId) {
      throw new ForbiddenException(
        'Apenas o admin criador pode excluir este evento',
      );
    }

    // Delete image from storage if exists
    if (event.imageUrl) {
      await this.storageService.deleteFileByUrl(event.imageUrl);
    }

    await (this.prisma as any).event.delete({ where: { id } });
    return { success: true };
  }

  async register(userId: string, eventId: string) {
    const event = await this.findOne(eventId);

    if (event.isDisabled) {
      throw new BadRequestException('Evento desabilitado');
    }

    if (
      event.isFull ||
      (event.seats && event.registeredUsers.length >= event.seats)
    ) {
      throw new BadRequestException('Evento lotado - não há vagas disponíveis');
    }

    const registration = await (this.prisma as any).eventRegistration.create({
      data: { userId, eventId },
    });

    if (event.seats && event.registeredUsers.length + 1 >= event.seats) {
      await (this.prisma as any).event.update({
        where: { id: eventId },
        data: { isFull: true },
      });
    }

    return registration;
  }

  async unregister(userId: string, eventId: string) {
    const event = await this.findOne(eventId);

    await (this.prisma as any).eventRegistration.delete({
      where: { userId_eventId: { userId, eventId } },
    });

    if (
      event.isFull &&
      event.seats &&
      event.registeredUsers.length <= event.seats
    ) {
      await (this.prisma as any).event.update({
        where: { id: eventId },
        data: { isFull: false },
      });
    }

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

  async getMyEvents(userId: string) {
    const registrations = await (this.prisma as any).eventRegistration.findMany(
      {
        where: {
          userId: userId,
        },
        include: {
          event: true,
        },
        orderBy: {
          registeredAt: 'desc',
        },
      },
    );

    return registrations.map((registration) => ({
      ...registration.event,
      registeredAt: registration.registeredAt,
    }));
  }
}
