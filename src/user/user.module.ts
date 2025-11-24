import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { BookModule } from 'src/book/book.module';
import { EventModule } from 'src/event/event.module';
import { StorageModule } from 'src/storage/storage.module';
@Module({
  imports: [BookModule, EventModule, StorageModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
