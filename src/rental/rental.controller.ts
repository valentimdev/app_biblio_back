import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { RentalService } from './rental.service';
import { CreateRentalDto } from './dto/create-rental.dto';

@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  rentBook(@Body() dto: CreateRentalDto) {
    return this.rentalService.rentBook(dto);
  }

  @Patch(':id/return')
  returnBook(@Param('id') id: string) {
    return this.rentalService.returnBook(id);
  }

  @Get()
  findAll() {
    return this.rentalService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.rentalService.findByUser(userId);
  }
}