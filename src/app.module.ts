import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';

import * as dotenv from "dotenv"
dotenv.config()

import UserModule from './module/user.module';
import RedisModule from './module/redis.module';

@Module({
  imports: [
    UserModule,
    RedisModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: `smtps://${process.env.AUTH_EMAIL}:${process.env.AUTH_PASSWORD}@${process.env.EMAIL_HOST}`,
        defaults: {
          from: `"${process.env.EMAIL_FROM_USER_NAME}" <${process.env.AUTH_EMAIL}>`,
        },
      })
    }),
  ],
})
export class AppModule {}
