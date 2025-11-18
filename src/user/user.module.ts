import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { BookModule } from 'src/book/book.module';

@Module({
  imports: [BookModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
