import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { StorageModule } from '../storage/storage.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [StorageModule, NotificationModule],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
