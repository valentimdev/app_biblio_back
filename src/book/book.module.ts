import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { StorageModule } from '../storage/storage.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [StorageModule, NotificationModule],
  providers: [BookService],
  controllers: [BookController],
  exports: [BookService],
})
export class BookModule {}
