import { Inject, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService,
    private prisma: PrismaService
  ) {
    const secret = config.get('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }
  async validate(payload: {
    sub: string;
    matricula?: string;
    role?: string;
    status?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === 'BANNED') {
      throw new ForbiddenException('Usuário banido');
    }

    const { passwordHash, ...result } = user as any;
    return result;
  }
}
