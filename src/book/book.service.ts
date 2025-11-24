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
    let imageUrl = dto.imageUrl;

    // Upload image if provided
    if (image) {
      imageUrl = await this.storageService.uploadFile(image, 'books');
    }

    // Se availableCopies foi fornecido no DTO, usa ele; caso contrário, inicia igual a totalCopies
    const availableCopies =
      dto.availableCopies !== undefined ? dto.availableCopies : dto.totalCopies;

    return this.prisma.book.create({
      data: {
        adminId,
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn,
        description: dto.description,
        totalCopies: dto.totalCopies,
        availableCopies, // Usa o valor do DTO ou totalCopies como padrão
        imageUrl,
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
      },
    });
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

    // Upload new image if provided
    if (image) {
      // Delete old image if exists
      if (book.imageUrl) {
        await this.storageService.deleteFileByUrl(book.imageUrl);
      }
      updateData.imageUrl = await this.storageService.uploadFile(
        image,
        'books',
      );
    } else if (dto.imageUrl !== undefined) {
      // If imageUrl is explicitly set in DTO (including null to remove), use it
      updateData.imageUrl = dto.imageUrl;
    }

    // Se availableCopies foi fornecido no DTO, usa ele
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

    return this.prisma.book.update({
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
      },
    });
  }

  async remove(id: string, adminId: string) {
    const book = await this.findOne(id);
    if (book.adminId !== adminId)
      throw new ForbiddenException('Only creator can delete');

    // Delete image from storage if exists
    if (book.imageUrl) {
      await this.storageService.deleteFileByUrl(book.imageUrl);
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

    // Notify user about the return
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

    // Notify user about the rental
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
          },
        },
      },
      orderBy: {
        rentalDate: 'desc',
      },
    });
    return rentals;
  }
}
