import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Prisma.JsonValue;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? NotificationType.GENERIC,
        data: input.data,
      },
    });
  }

  async notifyMany(
    userIds: string[],
    input: Omit<CreateNotificationInput, 'userId'>,
  ) {
    if (!userIds.length) return { count: 0 };
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        id: randomUUID(),
        userId,
        title: input.title,
        message: input.message,
        type: input.type ?? NotificationType.GENERIC,
        data: input.data ?? undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });
    return { count: userIds.length };
  }

  async listForUser(
    userId: string,
    params: { page?: number; limit?: number; status?: 'all' | 'unread' },
  ) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(params.status === 'unread' ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificação não encontrada');
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async notifyEventRegistration(userId: string, event: { id: string; title: string; startTime: Date }) {
    return this.create({
      userId,
      title: 'Inscrição confirmada',
      message: `Sua inscrição no evento "${event.title}" foi confirmada.`,
      type: NotificationType.EVENT_REGISTRATION,
      data: {
        eventId: event.id,
        startTime: event.startTime,
      },
    });
  }

  async notifyEventUnregistration(userId: string, event: { id: string; title: string }) {
    return this.create({
      userId,
      title: 'Inscrição cancelada',
      message: `Você cancelou sua inscrição no evento "${event.title}".`,
      type: NotificationType.EVENT_STATUS,
      data: {
        eventId: event.id,
      },
    });
  }

  async notifyEventStatusChange(
    userIds: string[],
    event: { id: string; title: string },
    statusMessage: string,
  ) {
    return this.notifyMany(userIds, {
      title: 'Atualização de evento',
      message: `O evento "${event.title}" foi ${statusMessage}.`,
      type: NotificationType.EVENT_STATUS,
      data: {
        eventId: event.id,
      },
    });
  }

  async notifyBookRental(
    userId: string,
    book: { id: string; title: string },
    dueDate: Date,
  ) {
    const readableDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dueDate);

    return this.create({
      userId,
      title: 'Livro alugado com sucesso',
      message: `Você alugou "${book.title}". Devolva até ${readableDate}.`,
      type: NotificationType.BOOK_RENTAL,
      data: {
        bookId: book.id,
        dueDate,
      },
    });
  }

  async notifyBookReturn(userId: string, book: { id: string; title: string }) {
    return this.create({
      userId,
      title: 'Livro devolvido',
      message: `Recebemos a devolução do livro "${book.title}". Obrigado!`,
      type: NotificationType.BOOK_RENTAL,
      data: {
        bookId: book.id,
      },
    });
  }
}

