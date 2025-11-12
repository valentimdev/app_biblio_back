import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { ImageModule } from "src/image/image.module";
import { JwtStrategy } from "./strategy";

@Module({
    imports:[PrismaModule, JwtModule.register({}),ConfigModule, ImageModule],
    controllers:[AuthControler],
    providers:[AuthService, JwtStrategy],
})
export class AuthModule{}