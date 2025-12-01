import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { EditBookDto } from './dto/edit-book.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { GetUser } from 'src/auth/decorator/get-user.decorator';

@UseGuards(JwtGuard)
@Controller('books')
export class BookController {
  constructor(private service: BookService) {}

  // 🔹 Lista pública (usuário final)
  @Get()
  findAllPublic() {
    return this.service.findAllPublic();
  }

  // 🔹 Lista completa (admin) – use no app de admin
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @GetUser('id') adminId: string,
    @Body() dto: CreateBookDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.service.create(adminId, dto, image);
  }

  @Get(':id/status')
  getBookWithStatus(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.service.getBookWithRentalStatus(id, userId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() dto: EditBookDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.service.update(id, adminId, dto, image);
  }

  /**
   * 🔹 Endpoint específico para atualizar flags (casa com o Android)
   * PATCH /books/:id/flags
   * body: { isHidden?: boolean; loanEnabled?: boolean }
   */
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/flags')
  updateFlags(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() body: { isHidden?: boolean; loanEnabled?: boolean },
  ) {
    return this.service.updateFlags(id, adminId, body);
  }

  // Se quiser, pode manter os toggle antigos como helpers extras:
  /*
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/toggle-visibility')
  toggleVisibility(@Param('id') id: string, @GetUser('id') adminId: string) {
    return this.service.toggleVisibility(id, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/toggle-loan')
  toggleLoan(@Param('id') id: string, @GetUser('id') adminId: string) {
    return this.service.toggleLoanEnabled(id, adminId);
  }
  */

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') adminId: string) {
    return this.service.remove(id, adminId);
  }

  @Post(':id/rent')
  rent(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() body: { dueDate: string },
  ) {
    return this.service.rentBook(userId, id, new Date(body.dueDate));
  }

  @Post(':id/return')
  return(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.service.returnBook(userId, id);
  }

  @Get('my-rentals')
  @UseGuards(JwtGuard)
  getMyRentals(@GetUser('id') userId: string) {
    return this.service.getMyRentals(userId);
  }
}
