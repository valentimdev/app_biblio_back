import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto, LoginDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/binary";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ChangePasswordDto } from './dto/password.dto';
import { RoleEnum } from "@prisma/client";
@Injectable()
export class AuthService {
    constructor(private prisma:PrismaService,private jwt:JwtService, private config:ConfigService){}

    async signup(dto:AuthDto){
        //gerar o hash do password
        const hash = await argon.hash(dto.password);
        //salvar o novo usuario no banco de dados
        try{
        const user = await this.prisma.user.create({
            data:{
                email: dto.email,
                passwordHash: hash,
                name: dto.name ?? dto.email.split('@')[0],
                matricula: dto.matricula,
                // role padrão USER no schema
            },
        });
        return this.signToken(user.id, user.email,user.role);
    }
        catch(error){
            if (error instanceof PrismaClientKnownRequestError) {
                if(error.code === 'P2002'){
                    throw new ForbiddenException('Credenciais ja estao em uso');
                }
            }
            throw error;
        }        
    }

    async signin(dto:LoginDto){
        //encontrar o usuario por email
        const user = await this.prisma.user.findUnique({
            where:{matricula: dto.matricula}
        },
        );
        //se nao encontrar, lancar excecao
        if(!user) throw new ForbiddenException('Credenciais incorretas');
        //se encontrar, verificar se o password esta correto
        const isPasswordValid = await argon.verify(user.passwordHash, dto.password);
        //se o password estiver incorreto, lancar excecao
        if(!isPasswordValid) throw new ForbiddenException('Credenciais incorretas'); 
        const tokenData = await this.signToken(user.id, user.matricula, user.role);
        return {
        access_token: tokenData.access_token,
        role: user.role                     
    };
    }

    async signToken(
        userId : string,
        matricula: string,
        role : RoleEnum
    ): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            matricula:matricula,
            role:role
        }
        const secret = this.config.get('JWT_SECRET');

        const token = await this.jwt.signAsync(
            payload,{
            expiresIn: '1d',
            secret: secret,
        }
    );
        return {
            access_token: token,
            
        };
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ForbiddenException('Usuário não encontrado');
        const valid = await argon.verify(user.passwordHash, dto.currentPassword);
        if (!valid) throw new ForbiddenException('Senha atual inválida');
        const newHash = await argon.hash(dto.newPassword);
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
        return { success: true };
    }

    // Stubs controlados: prontos para integrar e-mail/queue no futuro
    async requestPasswordReset(email: string) {
        // Não persistimos token por ausência no diagrama.
        // Responde 202 para integracão futura de e-mail.
        const exists = await this.prisma.user.findUnique({ where: { email } });
        if (!exists) return { accepted: true };
        return { accepted: true };
    }

    async resetPassword(_token: string, _newPassword: string) {
        // Sem tabela de tokens no diagrama, mantemos endpoint como no-op seguro
        return { success: true };
    }
}