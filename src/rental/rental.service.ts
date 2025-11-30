import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  async rentBook(dto: CreateRentalDto) {
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });
    if (!book) throw new NotFoundException('Livro não encontrado');
    if (book.availableCopies < 1)
      throw new ConflictException('Livro sem cópias disponíveis');

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const rentalDate = new Date();
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(rentalDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [rental] = await this.prisma.$transaction([
      this.prisma.rental.create({
        data: {
          userId: dto.userId,
          bookId: dto.bookId,
          rentalDate,
          dueDate,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, author: true } },
        },
      }),
      this.prisma.book.update({
        where: { id: dto.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    return rental;
  }

  async returnBook(rentalId: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
    });
    if (!rental) throw new NotFoundException('Aluguel não encontrado');
    if (rental.returnDate) throw new BadRequestException('Livro já devolvido');

    const [updatedRental] = await this.prisma.$transaction([
      this.prisma.rental.update({
        where: { id: rentalId },
        data: { returnDate: new Date() },
        include: {
          user: { select: { id: true, name: true, email: true } },
          book: { select: { id: true, title: true, author: true } },
        },
      }),
      this.prisma.book.update({
        where: { id: rental.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    return updatedRental;
  }

  async renewRental(rentalId: string, additionalDays: number = 7) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true } },
      },
    });

    if (!rental) throw new NotFoundException('Aluguel não encontrado');
    if (rental.returnDate)
      throw new BadRequestException('Não é possível renovar um livro já devolvido');

    const newDueDate = new Date(
      rental.dueDate.getTime() + additionalDays * 24 * 60 * 60 * 1000,
    );

    const updatedRental = await this.prisma.rental.update({
      where: { id: rentalId },
      data: { dueDate: newDueDate },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true } },
      },
    });

    return updatedRental;
  }

  async findAll() {
    return this.prisma.rental.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true } },
      },
    });
  }

  async findById(id: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true } },
      },
    });
    if (!rental) {
      throw new NotFoundException(`Aluguel com ID "${id}" não encontrado.`);
    }
    return rental;
  }

  async findByBook(bookId: string) {
    return this.prisma.rental.findMany({
      where: { bookId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.rental.findMany({
      where: { userId },
      include: {
        book: { select: { id: true, title: true, author: true } },
      },
    });
  }
}
