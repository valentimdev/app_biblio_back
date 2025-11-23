import { Module } from '@nestjs/common';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule

@Module({
  imports: [PrismaModule], // Adicione o PrismaModule aqui
  controllers: [RentalController],
  providers: [RentalService],
})
export class RentalModule {}