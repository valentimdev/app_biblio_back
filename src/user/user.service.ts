import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';

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
        const { passwordHash, ...userWithoutHash } = user as any;
        return userWithoutHash;
    }
}
