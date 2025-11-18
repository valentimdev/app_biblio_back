import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { BookModule } from 'src/book/book.module';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [BookModule, EventModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
