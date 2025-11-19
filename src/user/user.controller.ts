import { Body, Controller, Get, Param, Patch, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { EditUserDto } from './dto/edit-user.dto';
import { UserService } from './user.service';
import { BookService } from 'src/book/book.service';
import { EventService } from 'src/event/event.service';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private bookService: BookService,
    private eventService: EventService,
  ) {}

  @Get('me')
  async getMe(@GetUser() user: any) {
    const rentals = await this.bookService.getMyRentals(user.id);
    const events = await this.eventService.getMyEvents(user.id);

    return {
      ...user,
      rentals: rentals,
      events: events,
    };
  }

  @Patch()
  @UseInterceptors(FileInterceptor('image'))
  editUser(
    @GetUser('id') userId: string,
    @Body() dto: EditUserDto,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.userService.editUser(userId, dto, image);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateStatus(id, dto.status);
  }
}