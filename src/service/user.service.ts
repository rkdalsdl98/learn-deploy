import { Injectable } from "@nestjs/common";

import { 
    Security, 
    MyMailerService, 
    ERROR,
    jwtFactory
} from "../utils";
import UserRepository from "../repository/user.repository";
import RedisService from "./redis.service";

@Injectable()
export class UserService {
    constructor(
        private readonly repository: UserRepository,
        private readonly mailerService: MyMailerService,
        private readonly redisService: RedisService,
    ){}

    public async login(args: LoginArgs) {
        try {
            const entity = await this.repository.findUserByEmail(args.email)
            if(!entity) throw ERROR.NotFoundData

            const verify = Security.verify(
                args.pass,
                entity.salt,
                entity.pass
            )
            if(verify) {
                const user = this._toUserDto(entity)
                const accesstoken = jwtFactory.PublishToken({ email: user.email })
                const refreshtoken = jwtFactory.PublishToken({ email: user.email }, true)
                this.redisService.set(user.email, user.profile, "UserService", 86400)
                return { user, accesstoken, refreshtoken }
            }
            throw ERROR.NonAuthoritativeInformation
        } catch(e) { throw e }
    }

    public async sendConfirmEmail(email: string & tags.Format<"email">) {
        // 1차 캐시에 등록되어 있는지 확인
        const isAlreadyEmailFromCache = !!(await this.redisService.get<ProfileDto | string>(email, "UserService"))
        if(isAlreadyEmailFromCache) return false

        // 2차 캐시에 존재 하지 않고 DB에 존재하는지 확인
        // 존재한다면 캐시에 등록
        const userEntity = await this.repository.findUserByEmail(email)
        if(userEntity) {
            this.redisService.set(
                email, 
                userEntity.profile ? this._toProfileDto(userEntity.profile) : "empty",
                "UserService",
                86400,
            )
            return false
        }

        const secret = Security.getRandNanoId(6).toUpperCase()
        this.redisService.set(secret, email, "UserService", 300)
        this.mailerService.sendMail({
            to: email,
            secret,
        })
        return true
    }

    public async receiveConfirmEmail(
        email: string & tags.Format<"email">,
        secret: string
    ) {
        const cache = await this.redisService.get<string>(secret, "UserService")
        if(!cache || cache !== email) return null

        const code = Security.getRandNanoId(16)
        this.redisService.delete(secret, "UserService")
        this.redisService.set(code, email, "UserService", 3600)
        return code
    }

    public async signUp(args: SignUpArgs) {
        try {
            const cache = await this.redisService.get<string & tags.Format<"email">>(args.code, "UserService")
            if(!cache || cache !== args.email) throw ERROR.Forbidden

            const { hash: pass, salt } = Security.encryption(args.pass)
            this.redisService.delete(args.code, "UserService")
            return !!(await this.repository.createUser({
                email: args.email,
                pass,
                salt,
                nickname: args.nickname,
            }))
        } catch(e) { throw e }
    }

    public async signOut(args: SignOutArgs) {
        try {
            return !!(await this.repository.deleteUser(args.email))
        } catch(e) { throw e }
    }

    public async editNickname(args: EditNicknameArgs) {
        try {
            await this.redisService.delete(args.email, "UserService")
            return !!(await this.repository.editUserNickname({
                email: args.email,
                nickname: args.nickname,               
            }))
        } catch(e) { throw e }
    }

    private _toUserDto(entity: UserEntity) {
        return {
            email: entity.email,
            profile: entity.profile 
            ? this._toProfileDto(entity.profile)
            : null
        } satisfies UserDto
    }

    private _toProfileDto(entity: ProfileEntity) {
        return {
            nickname: entity.nickname,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        }
    }
}

import { tags } from "typia"
import { UserEntity } from "../provider/user.provider";
import { ProfileEntity } from "../provider/profile.provider";

export interface UserDto {
    email: string & tags.Format<"email">
    profile: Omit<ProfileDto, "user_email"> | null
}

interface ProfileDto {
    nickname: string & tags.MaxLength<10>
    user_email: string & tags.Format<"email">
    createdAt: Date
    updatedAt: Date
}

interface LoginArgs {
    email: string & tags.Format<"email">
    pass: string
}

interface SignUpArgs {
    email: string & tags.Format<"email">
    code: string & tags.MaxLength<16>
    pass: string
    nickname: string & tags.MaxLength<10>
}

interface SignOutArgs {
    email: string & tags.Format<"email">
}

interface EditNicknameArgs {
    email: string & tags.Format<"email">
    nickname: string & tags.MaxLength<10>
}