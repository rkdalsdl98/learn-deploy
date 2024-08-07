import { Module } from "@nestjs/common";

import { MyMailerService } from "../utils";
import { UserService } from "../service/user.service";
import UserController from "../controller/user.controller";
import UserRepository from "../repository/user.repository";
import RedisService from "../service/redis.service";

@Module({
    controllers: [UserController],
    providers: [
        MyMailerService,
        RedisService,
        UserService,
        UserRepository,
    ],
})
export default class UserModule {}