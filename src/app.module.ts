import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from './event/event.module';
import { HomeModule } from './home/home.module';
  
@Module({
  imports: [AuthModule, UserModule, EventModule, HomeModule, PrismaModule, ConfigModule.forRoot({isGlobal:true})],
})
export class AppModule {}
