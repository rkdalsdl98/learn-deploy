import { Injectable } from "@nestjs/common";
import { tags } from "typia"

import { 
    UserProvider 
} from "../provider/user.provider";

@Injectable()
export default class UserRepository {
    public async findUserByEmail(email: string & tags.Format<"email">) {
        try {
            return await UserProvider
            .Query
            .findUnique({ where: { email }})
        } catch(e) { throw e }
    }

    public async editUserNickname(args: EditUserArgs) {
        try {
            return await UserProvider
            .Query
            .update({
                where: { email: args.email },
                data: {
                    profile: {
                        update: {
                            data: { nickname: args.nickname }
                        }
                    }
                }
            })
        } catch(e) { throw e }
    }

    public async createUser(args: CreateUserArgs) {
        try {
            return await UserProvider
            .Query
            .create({
                data: {
                    email: args.email,
                    pass: args.pass,
                    salt: args.salt,
                    profile: {
                        create: { nickname: args.nickname }
                    }
                }
            })
        } catch(e) { throw e }
    }

    public async deleteUser(email: string & tags.Format<"email">) {
        try {
            return await UserProvider
            .Query
            .remove({ where: { email }})
        } catch(e) { throw e }
    }
}

interface EditUserArgs {
    email: string & tags.Format<"email">
    nickname: string & tags.MaxLength<10>
}

interface CreateUserArgs {
    email: string & tags.Format<"email">
    pass: string & tags.MaxLength<100>
    salt: string & tags.MaxLength<34>
    nickname: string & tags.MaxLength<10>
}