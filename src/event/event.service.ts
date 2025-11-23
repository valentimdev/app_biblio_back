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
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    adminId: string,
    dto: CreateEventDto,
    image?: Express.Multer.File,
  ) {
    let imageUrl = dto.imageUrl;

    if (image) {
      imageUrl = await this.storageService.uploadFile(image, 'events');
    }

    return (this.prisma as any).event.create({
      data: {
        title: dto.title,
        description: dto.description,

        registrationStartTime: dto.registrationStartTime ? new Date(dto.registrationStartTime) : null,
        registrationEndTime: dto.registrationEndTime ? new Date(dto.registrationEndTime) : null,

        eventStartTime: new Date(dto.eventStartTime),
        eventEndTime: new Date(dto.eventEndTime),


        startTime: new Date(dto.startTime || dto.eventStartTime),
        endTime: new Date(dto.endTime || dto.eventEndTime),

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
      orderBy: { eventStartTime: 'asc' },
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


  if (dto.registrationStartTime) {
    updateData.registrationStartTime = new Date(dto.registrationStartTime);
  }
  if (dto.registrationEndTime) {
    updateData.registrationEndTime = new Date(dto.registrationEndTime);
  }
  if (dto.eventStartTime) {
    updateData.eventStartTime = new Date(dto.eventStartTime);
  }
  if (dto.eventEndTime) {
    updateData.eventEndTime = new Date(dto.eventEndTime);
  }


  if (dto.startTime) {
    updateData.startTime = new Date(dto.startTime);
  }
  if (dto.endTime) {
    updateData.endTime = new Date(dto.endTime);
  }


  if (image) {

    if (event.imageUrl) {
      await this.storageService.deleteFileByUrl(event.imageUrl);
    }
    updateData.imageUrl = await this.storageService.uploadFile(
      image,
      'events',
    );
  } else if (dto.imageUrl !== undefined) {
    updateData.imageUrl = dto.imageUrl;
  }

  const updatedEvent = await (this.prisma as any).event.update({
    where: { id },
    data: updateData,
  });

  if (
    dto.isDisabled !== undefined &&
    dto.isDisabled !== event.isDisabled
  ) {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId: id },
      select: { userId: true },
    });
    if (registrations.length) {
      await this.notificationService.notifyEventStatusChange(
        registrations.map((reg) => reg.userId),
        { id, title: updatedEvent.title },
        updatedEvent.isDisabled ? 'desabilitado' : 'reabilitado',
      );
    }
  }

  return updatedEvent;
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

    const registrations = await this.prisma.eventRegistration.findMany({
      where: { eventId: id },
      select: { userId: true },
    });

    await (this.prisma as any).event.delete({ where: { id } });

    if (registrations.length) {
      await this.notificationService.notifyEventStatusChange(
        registrations.map((reg) => reg.userId),
        { id, title: event.title },
        'cancelado',
      );
    }
    return { success: true };
  }

  async register(userId: string, eventId: string) {
    const event = await this.findOne(eventId);

    if (event.isDisabled) {
      throw new BadRequestException('Evento desabilitado');
    }

    const now = new Date();

    // Verificar período de inscrição
    if (event.registrationStartTime && now < new Date(event.registrationStartTime)) {
      throw new BadRequestException('Período de inscrição ainda não iniciou');
    }

    if (event.registrationEndTime && now > new Date(event.registrationEndTime)) {
      throw new BadRequestException('Período de inscrição encerrado');
    }

    // Verificar se evento já aconteceu
    if (now > new Date(event.eventStartTime)) {
      throw new BadRequestException('Evento já aconteceu');
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

    await this.notificationService.notifyEventRegistration(userId, {
      id: eventId,
      title: event.title,
      startTime: new Date(event.eventStartTime), // Data real do evento
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

    await this.notificationService.notifyEventUnregistration(userId, {
      id: eventId,
      title: event.title,
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
    async getEventWithRegistrationStatus(eventId: string, userId: string) {
    const event = await this.findOne(eventId);

    // Verifica se o usuário está inscrito neste evento
    const userRegistration = await this.prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return {
      ...event,
      isRegisteredByUser: !!userRegistration,
      registrationInfo: userRegistration ? {
        registeredAt: userRegistration.registeredAt,
      } : null,
    };
  }
}
