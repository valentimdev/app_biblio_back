import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { GetUser } from 'src/auth/decorator/get-user.decorator';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @GetUser('id') adminId: string,
    @Body() dto: CreateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.eventService.create(adminId, dto, image);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body() dto: UpdateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.eventService.update(id, adminId, dto, image);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') adminId: string) {
    return this.eventService.remove(id, adminId);
  }

  @UseGuards(JwtGuard)
  @Post(':id/register')
  register(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.eventService.register(userId, id);
  }

  @UseGuards(JwtGuard)
  @Delete(':id/register')
  unregister(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.eventService.unregister(userId, id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/registrations')
  registrations(@Param('id') id: string) {
    return this.eventService.listRegistrations(id);
  }
}


