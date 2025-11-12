import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { EditBookDto } from './dto/edit-book.dto';

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.book.findMany();
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async create(adminId: string, dto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        adminId,
        availableCopies: dto.totalCopies,
        ...dto,
      },
    });
  }

  async update(id: string, adminId: string, dto: EditBookDto) {
    const book = await this.findOne(id);
    if (book.adminId !== adminId) throw new ForbiddenException('Only creator can edit');
    return this.prisma.book.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string, adminId: string) {
    const book = await this.findOne(id);
    if (book.adminId !== adminId) throw new ForbiddenException('Only creator can delete');
    await this.prisma.book.delete({ where: { id } });
    return { success: true };
  }
  
  async returnBook(userId: string, bookId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { userId, bookId, returnDate: null },
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

  console.log('Rental criado:', rental);
  return { success: true };
}

}
