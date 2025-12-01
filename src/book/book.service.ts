import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { NotificationService } from 'src/notification/notification.service';
import { CreateBookDto } from './dto/create-book.dto';
import { EditBookDto } from './dto/edit-book.dto';

@Injectable()
export class BookService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll() {
    return this.prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        description: true,
        imageUrl: true,
        totalCopies: true,
        availableCopies: true,
        createdAt: true,
        updatedAt: true,
        adminId: true,
        isHidden: true,
        loanEnabled: true,
      },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        description: true,
        imageUrl: true,
        totalCopies: true,
        availableCopies: true,
        createdAt: true,
        updatedAt: true,
        adminId: true,
        isHidden: true,
        loanEnabled: true,
      },
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async create(
    adminId: string,
    dto: CreateBookDto,
    image?: Express.Multer.File,
  ) {
    try {
      let imageUrl = dto.imageUrl;

      if (image) {
        try {
          imageUrl = await this.storageService.uploadFile(image, 'books');
        } catch (error) {
          console.error('Error uploading image:', error);
          throw new BadRequestException(
            error instanceof BadRequestException
              ? error.message
              : 'Erro ao fazer upload da imagem',
          );
        }
      }

      const availableCopies =
        dto.availableCopies !== undefined ? dto.availableCopies : dto.totalCopies;

      try {
        return await this.prisma.book.create({
          data: {
            adminId,
            title: dto.title,
            author: dto.author,
            isbn: dto.isbn,
            description: dto.description,
            totalCopies: dto.totalCopies,
            availableCopies,
            imageUrl,
            // isHidden e loanEnabled usam o default do Prisma,
            // mas se você quiser permitir no DTO, pode colocar:
            // isHidden: dto.isHidden ?? false,
            // loanEnabled: dto.loanEnabled ?? true,
          },
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            description: true,
            imageUrl: true,
            totalCopies: true,
            availableCopies: true,
            createdAt: true,
            updatedAt: true,
            adminId: true,
            isHidden: true,
            loanEnabled: true,
          },
        });
      } catch (error) {
        console.error('Error creating book in database:', error);

        if (imageUrl && imageUrl !== dto.imageUrl) {
          try {
            await this.storageService.deleteFileByUrl(imageUrl);
          } catch (deleteError) {
            console.error('Error deleting uploaded image after DB error:', deleteError);
          }
        }

        if (error && typeof error === 'object' && 'code' in error) {
          const prismaError = error as any;
          if (prismaError.code === 'P2002') {
            throw new BadRequestException('Já existe um livro com esse ISBN');
          }
          if (prismaError.code === 'P2003') {
            throw new BadRequestException(
              'Referência inválida. Verifique os dados fornecidos.',
            );
          }
        }

        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = (error as any).message;
          if (errorMessage && typeof errorMessage === 'string') {
            throw new BadRequestException(`Erro ao criar livro: ${errorMessage}`);
          }
        }

        throw new BadRequestException(
          'Erro ao criar livro. Verifique os dados fornecidos.',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Unexpected error in create book:', error);
      throw new BadRequestException('Erro inesperado ao criar livro');
    }
  }

  async update(
    id: string,
    adminId: string,
    dto: EditBookDto,
    image?: Express.Multer.File,
  ) {
    const book = await this.findOne(id);
    if (book.adminId !== adminId)
      throw new ForbiddenException('Only creator can edit');

    const updateData: any = { ...dto };

    if (image) {
      if (book.imageUrl) {
        await this.storageService.deleteFileByUrl(book.imageUrl);
      }
      updateData.imageUrl = await this.storageService.uploadFile(image, 'books');
    } else if (dto.imageUrl !== undefined) {
      updateData.imageUrl = dto.imageUrl;
    }

    if (dto.availableCopies !== undefined) {
      updateData.availableCopies = dto.availableCopies;
    } else if (
      dto.totalCopies !== undefined &&
      dto.totalCopies !== book.totalCopies
    ) {
      const difference = dto.totalCopies - book.totalCopies;
      const newAvailableCopies = Math.max(0, book.availableCopies + difference);
      updateData.availableCopies = newAvailableCopies;
    }

    const updated = await this.prisma.book.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        description: true,
        imageUrl: true,
        totalCopies: true,
        availableCopies: true,
        createdAt: true,
        updatedAt: true,
        adminId: true,
        isHidden: true,
        loanEnabled: true,
      },
    });

    return updated;
  }

  async remove(id: string, adminId: string) {
    const book = await this.findOne(id);
    if (book.adminId !== adminId) {
      throw new ForbiddenException('Only creator can delete');
    }

    const rentals = await this.prisma.rental.findMany({
      where: { bookId: id },
      select: { id: true },
    });

    if (rentals.length > 0) {
      throw new BadRequestException(
        `Não é possível excluir o livro pois existem ${rentals.length} aluguel(is) associado(s). Primeiro, finalize ou cancele os aluguéis.`,
      );
    }

    if (book.imageUrl) {
      try {
        await this.storageService.deleteFileByUrl(book.imageUrl);
      } catch (error) {
        console.error('Error deleting book image from storage:', error);
      }
    }

    await this.prisma.book.delete({ where: { id } });
    return { success: true };
  }

  async returnBook(userId: string, bookId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { userId, bookId, returnDate: null },
      include: { book: true },
    });
    if (!rental) throw new NotFoundException('Rental not found');

    await this.prisma.rental.update({
      where: { id: rental.id },
      data: { returnDate: new Date() },
    });

    await this.prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { increment: 1 } as any },
    });

    await this.notificationService.notifyBookReturn(userId, {
      id: rental.book.id,
      title: rental.book.title,
    });

    return { success: true };
  }

  async rentBook(userId: string, bookId: string, dueDate: Date) {
    console.log('rentBook chamado:', { userId, bookId, dueDate });

    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Livro não encontrado');

    // 👇 bloqueia se oculto ou com empréstimo desativado
    if (book.isHidden) {
      throw new BadRequestException('Livro oculto. Não disponível para empréstimo.');
    }
    if (!book.loanEnabled) {
      throw new BadRequestException('Empréstimo desativado para este livro.');
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException('Sem cópias disponíveis');
    }

    const activeRental = await this.prisma.rental.findFirst({
      where: { userId, bookId, returnDate: null },
    });

    if (activeRental) {
      throw new BadRequestException('Você já alugou este livro');
    }

    await this.prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    });

    const rental = await this.prisma.rental.create({
      data: {
        userId,
        bookId,
        rentalDate: new Date(),
        dueDate,
      },
    });

    await this.notificationService.notifyBookRental(
      userId,
      {
        id: book.id,
        title: book.title,
      },
      dueDate,
    );

    console.log('Rental criado:', rental);
    return { success: true };
  }

  async getBookWithRentalStatus(bookId: string, userId: string) {
    const book = await this.findOne(bookId);

    const activeRental = await this.prisma.rental.findFirst({
      where: {
        bookId,
        userId,
        returnDate: null,
      },
    });

    return {
      ...book,
      isRentedByUser: !!activeRental,
      rentalInfo: activeRental
        ? {
            rentalDate: activeRental.rentalDate,
            dueDate: activeRental.dueDate,
            isOverdue: new Date() > activeRental.dueDate,
          }
        : null,
    };
  }

  async getMyRentals(userId: string) {
    const rentals = await this.prisma.rental.findMany({
      where: {
        userId: userId,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            description: true,
            imageUrl: true,
            totalCopies: true,
            availableCopies: true,
            createdAt: true,
            updatedAt: true,
            adminId: true,
            isHidden: true,
            loanEnabled: true,
          },
        },
      },
      orderBy: {
        rentalDate: 'desc',
      },
    });
    return rentals;
  }

  // 🔹 Toggle: ocultar/exibir livro
  async toggleVisibility(id: string, adminId: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    if (book.adminId !== adminId) {
      throw new ForbiddenException('Only creator can change visibility');
    }

    const updated = await this.prisma.book.update({
      where: { id },
      data: { isHidden: !book.isHidden },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        description: true,
        imageUrl: true,
        totalCopies: true,
        availableCopies: true,
        createdAt: true,
        updatedAt: true,
        adminId: true,
        isHidden: true,
        loanEnabled: true,
      },
    });

    return updated;
  }

  // 🔹 Toggle: ativar/desativar empréstimo
  async toggleLoanEnabled(id: string, adminId: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    if (book.adminId !== adminId) {
      throw new ForbiddenException('Only creator can change loan status');
    }

    const updated = await this.prisma.book.update({
      where: { id },
      data: { loanEnabled: !book.loanEnabled },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        description: true,
        imageUrl: true,
        totalCopies: true,
        availableCopies: true,
        createdAt: true,
        updatedAt: true,
        adminId: true,
        isHidden: true,
        loanEnabled: true,
      },
    });

    return updated;
  }
}
