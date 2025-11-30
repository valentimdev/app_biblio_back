import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { RentalService } from './rental.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@UseGuards(JwtGuard)
@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  rentBook(@Body() dto: CreateRentalDto) {
    return this.rentalService.rentBook(dto);
  }

  @Patch(':id/return')
  returnBook(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalService.returnBook(id);
  }

  @Patch(':id/renew')
  renewRental(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { additionalDays?: number },
  ) {
    const additionalDays = body?.additionalDays || 7;
    return this.rentalService.renewRental(id, additionalDays);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.rentalService.findAll();
  }

  @Get('book/:bookId')
  findByBook(@Param('bookId', ParseUUIDPipe) bookId: string) {
    return this.rentalService.findByBook(bookId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rentalService.findByUser(userId);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalService.findById(id);
  }
}
