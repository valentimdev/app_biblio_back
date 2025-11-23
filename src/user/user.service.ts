import { User, RoleEnum, UserStatus } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon from 'argon2';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService
    ){}

    async editUser(userId: string, dto: EditUserDto, image?: Express.Multer.File) {
        let imageUrl: string | undefined;

        if (image) {
            imageUrl = await this.storageService.uploadFile(image, 'users');
        }

        const user = await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                ...dto,
                ...(imageUrl && { imageUrl }),
            }
        });

        const { passwordHash, ...userWithoutHash } = user;
        return userWithoutHash;    }

    async createUser(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
        const hash = await argon.hash(dto.password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hash,
                    name: dto.name,
                    matricula: dto.matricula,
                    role: dto.role,
                    status: dto.status ?? UserStatus.ACTIVE,
                },
            });

            const { passwordHash, ...result } = user;
            return result;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Credenciais (email ou matrícula) já estão em uso');
                }
            }
            throw error;
        }
    }


    async findAll() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                matricula: true,
                role: true,
                imageUrl: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return users;
    }

    async toggleStatus(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        // Alterna entre ACTIVE e BANNED
        const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.BANNED : UserStatus.ACTIVE;

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { status: newStatus },
            select: {
                id: true,
                email: true,
                name: true,
                matricula: true,
                role: true,
                status: true,
                imageUrl: true,
                updatedAt: true,
            },
        });

        return {
            ...updated,
            action: newStatus === UserStatus.BANNED ? 'blocked' : 'unblocked',
        };
    }

        async getDashboardStats() {

        const totalUsers = await this.prisma.user.count({
            where: {
                role: 'USER'
            }
        });

        const totalBooks = await this.prisma.book.count();


        const totalRentedBooks = await this.prisma.rental.count({
            where: {
                returnDate: null
            }
        });

        const topRentedBooks = await this.prisma.rental.groupBy({
            by: ['bookId'],
            _count: {
                bookId: true
            },
            orderBy: {
                _count: {
                    bookId: 'desc'
                }
            },
            take: 5
        });

        const topBooksWithInfo = await Promise.all(
            topRentedBooks.map(async (rental) => {
                const book = await this.prisma.book.findUnique({
                    where: { id: rental.bookId },
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        imageUrl: true,
                        isbn: true
                    }
                });
                return {
                    ...book,
                    totalRentals: rental._count.bookId
                };
            })
        );

        return {
            totalUsers,
            totalBooks,
            totalRentedBooks,
            availableBooks: totalBooks - totalRentedBooks,
            topRentedBooks: topBooksWithInfo
        };
    }

    async getUserStats() {
        const totalUsers = await this.prisma.user.count();

        const activeUsers = await this.prisma.user.count({
            where: {
                status: 'ACTIVE'
            }
        });

        const bannedUsers = await this.prisma.user.count({
            where: {
                status: 'BANNED'
            }
        });

        return {
            totalUsers,
            activeUsers,
            bannedUsers
        };
    }
}
