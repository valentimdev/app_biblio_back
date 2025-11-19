import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(
    @GetUser('id') userId: string,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationService.listForUser(userId, query);
  }

  @Patch(':id/read')
  markAsRead(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.notificationService.markAsRead(userId, id);
  }

  @Patch('read-all')
  markAll(@GetUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }
}

