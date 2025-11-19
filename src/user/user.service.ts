import { User, RoleEnum } from '@prisma/client';
import { Injectable } from '@nestjs/common';
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
                },
            });

            const { passwordHash, ...result } = user;
            return user;
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
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return users;
    }
}
