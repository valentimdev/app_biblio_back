import { User, RoleEnum } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';
import { ImageService } from 'src/image/image.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly imageService: ImageService,
  ) {}

  private normalizeAvatarId(
    avatarImageId?: string | null,
  ): string | null | undefined {
    if (typeof avatarImageId === 'undefined') return undefined;
    if (avatarImageId === null) return null;
    const trimmed = avatarImageId.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }

  async editUser(userId: string, dto: EditUserDto) {
    const { avatarImageId, ...rest } = dto;
    const normalizedAvatarId = this.normalizeAvatarId(avatarImageId);

    if (typeof normalizedAvatarId === 'string') {
      await this.imageService.findById(normalizedAvatarId);
    }

    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...rest,
        ...(normalizedAvatarId !== undefined && {
          avatarImageId: normalizedAvatarId,
        }),
      },
      include: {
        avatarImage: true,
      },
    });
    const { passwordHash, ...userWithoutHash } = user as any;
    return userWithoutHash;
  }
}
