import { Module } from '@nestjs/common';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BookModule } from '../book/book.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, BookModule, UserModule],
  controllers: [RentalController],
  providers: [RentalService],
})
export class RentalModule {}
