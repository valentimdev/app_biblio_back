import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from './event/event.module';
import { HomeModule } from './home/home.module';
import { BookModule } from './book/book.module';
import { ChatModule } from './chat/chat.module';
import { StorageModule } from './storage/storage.module';
import { NotificationModule } from './notification/notification.module';
import { RentalModule } from './rental/rental.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    EventModule,
    HomeModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    BookModule,
    ChatModule,
    StorageModule,
    NotificationModule,
    RentalModule,
  ],
})
export class AppModule {}
