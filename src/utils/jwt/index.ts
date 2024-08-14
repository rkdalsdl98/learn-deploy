import { 
    JwtService,
    JsonWebTokenError, 
} from "@nestjs/jwt"

import { 
    Logger 
} from "@nestjs/common"
const logger = new Logger("JwtFactory")

import { tags } from "typia"
import { ERROR } from "../auth"

import * as dotenv from "dotenv"
dotenv.config()

import { assert, validate } from "typia"
import { FileSystem } from "../filesystem"

class JwtFactory {
    private jwtService: JwtService | undefined
    private expiration: string | undefined
    private expiration_refresh: string | undefined


    constructor() { this.InitLoadJwtService() }

    public InitLoadJwtService() {
        logger.log("JwtService 로드 시작...")
        if(this.jwtService) {
            logger.log("JwtService가 이미 로드 되어 있습니다.\n로드를 중지합니다.")
            return
        }
        try {
            // 런타임 환경 변수 로드
            this.expiration = process.env.JWT_EXPIRATION
            this.expiration_refresh = process.env.JWT_EXPIRATION

            if(!this.expiration || !this.expiration_refresh) {
                logger.log("런타임 환경변수가 제대로 로드 되지 않았습니다.\n기본값으로 대체 됩니다.")
                this.expiration = "30m"
                this.expiration_refresh = "1d"
            }

            // 정적 환경 변수 로드
            const secret = assert<string>(process.env.JWT_SECRET)
            const algorithm = validate<Algorithm>(process.env.JWT_ALGORITHM).success ? process.env.JWT_ALGORITHM as Algorithm : "HS256"
            
            this.jwtService = new JwtService({
                global: false,
                secret: secret,
                signOptions: { algorithm },
                verifyOptions: { ignoreExpiration: true }
            })
            logger.log("JwtService 로드를 성공적으로 마쳤습니다.")
        } catch(e) {
            logger.error("JwtService 로드 중, 오류가 발생했습니다.")
            if(e instanceof JsonWebTokenError) {
                logger.error(`${e.name}\n${e.message}\n${e.inner}`)
            } else logger.error(e)

            logger.error("서비스를 종료합니다.")
            process.exit()
        }
    }

    public PublishToken(
        payload: Buffer | Object,
        isRefresh: boolean = false
    ): string {
        const expiresIn = isRefresh ? this.expiration : this.expiration_refresh
        return this.jwtService?.sign(payload, { expiresIn })!
    }

    public VerifyToken(token: string): Payload {
        try {
            const payload = this.jwtService?.verify(token)!
            const { exp, iat, email } = payload
            if(validate<string & tags.Format<"email">>(email).success)
                return {
                    exp, 
                    iat, 
                    data: email,
                    expired: this._isExpired(exp),
                } as Payload
            
            let error = ERROR.UnAuthorized
            error.substatus = "ForgeryData"
            throw error
        } catch(e) {
            const message = `[비정상적인 토큰 접근]\n오염된 토큰으로 요청이 들어왔습니다.\n${e.toString()}`
            logger.error(message)
            FileSystem.append("logs", "jwt.txt", message)

            if(e instanceof JsonWebTokenError) {
                let error = ERROR.UnAuthorized
                error.substatus = "ForgeryData"
                throw error
            }
            throw e
        }
    }

    private _isExpired(exp: number) : boolean {
        const now = new Date(Date.now())
        const exp_date = new Date(exp * 1000)
        return now > exp_date
    }
}

export const jwtFactory = new JwtFactory()

export type Algorithm =
    | "HS256"
    | "HS384"
    | "HS512"
    | "RS256"
    | "RS384"
    | "RS512"
    | "ES256"
    | "ES384"
    | "ES512"
    | "PS256"
    | "PS384"
    | "PS512"
    | "none"

export type Payload = {
    data: string & tags.Format<"email">
    expired: boolean
    exp: number & tags.MaxLength<11>
    iat: number & tags.MaxLength<11>
}