import { User, RoleEnum } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon from 'argon2';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
@Injectable()
export class UserService {
    constructor(private prisma:PrismaService){}
    async editUser(userId:string, dto:EditUserDto){
        const user = await this.prisma.user.update({
            where:{
                id:userId
            },
            data:{
                ...dto,
            }
        });
        const { passwordHash, ...userWithoutHash } = user;
        return userWithoutHash;
    }

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
    }}
}
