import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { config } from 'process';

@Injectable()
export class PrismaService extends PrismaClient{
    constructor(config: ConfigService){
        super({
            datasources: {
                db: {
                    url: config.get('DATABASE_URL'), // Ensure you have DATABASE_URL in your environment variables
                }
            }
        })
    }
    cleanDb() {
        return this.$transaction([
            this.eventRegistration.deleteMany(),
            this.event.deleteMany(),
            this.user.deleteMany(),
            this.image.deleteMany(),
            this.book.deleteMany(),
            this.rental.deleteMany(),
        ]);
    }
}
