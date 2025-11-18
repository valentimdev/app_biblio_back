import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [BookService],
  controllers: [BookController],
  exports: [BookService],
})
export class BookModule {}
