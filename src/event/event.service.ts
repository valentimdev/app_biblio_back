import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ImageService } from 'src/image/image.service';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: ImageService,
  ) {}

  private normalizeImageId(
    imageId?: string | null,
  ): string | null | undefined {
    if (typeof imageId === 'undefined') return undefined;
    if (imageId === null) return null;
    const trimmed = imageId.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }

  async create(adminId: string, dto: CreateEventDto) {
    const normalizedImageId = this.normalizeImageId(dto.imageId);

    if (typeof normalizedImageId === 'string') {
      await this.imageService.findById(normalizedImageId);
    }

    return (this.prisma as any).event.create({
      data: {
        title: dto.title,
        description: dto.description,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        ...(normalizedImageId !== undefined && {
          imageId: normalizedImageId,
        }),
        lecturers: dto.lecturers,
        seats: dto.seats,
        isDisabled: dto.isDisabled || false,
        adminId,
      },
      include: {
        image: true,
      },
    });
  }

  async findAll() {
    return (this.prisma as any).event.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        image: true,
      },
    });
  }

  async findOne(id: string) {
    const event = await (this.prisma as any).event.findUnique({
      where: { id },
      include: { image: true },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');
    return event;
  }

  async update(id: string, adminId: string, dto: UpdateEventDto) {
    const event = await this.findOne(id);
    if (event.adminId !== adminId) {
      throw new ForbiddenException('Apenas o admin criador pode editar este evento');
    }

    const { imageId, ...rest } = dto;
    const normalizedImageId = this.normalizeImageId(imageId);

    if (typeof normalizedImageId === 'string') {
      await this.imageService.findById(normalizedImageId);
    }

    return (this.prisma as any).event.update({
      where: { id },
      data: {
        ...rest,
        ...(normalizedImageId !== undefined && {
          imageId: normalizedImageId,
        }),
      },
      include: {
        image: true,
      },
    });
  }

  async remove(id: string, adminId: string) {
    const event = await this.findOne(id);
    if (event.adminId !== adminId) {
      throw new ForbiddenException('Apenas o admin criador pode excluir este evento');
    }
    await (this.prisma as any).event.delete({ where: { id } });

    if (event.imageId) {
      await this.imageService.delete(event.imageId).catch((error: unknown) => {
        const reason =
          error instanceof Error ? `${error.message}` : String(error);
        this.logger.warn(
          `Falha ao remover imagem associada ao evento ${id}: ${reason}`,
        );
      });
    }
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
      include: {
        user: {
          include: {
            avatarImage: true,
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });
  }
}


