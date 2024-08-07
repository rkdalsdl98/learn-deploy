import { 
    createCipheriv, 
    createDecipheriv, 
    pbkdf2Sync 
} from "crypto"
import { nanoid } from "nanoid"

import * as dotenv from "dotenv"
dotenv.config()

const private_key = process.env.PRIVATE_KEY

export namespace Security {
    export const getRandNanoId = (size?: number) => nanoid(size ?? 32)
    export const encryption = (
        data: string,
        options?: EncryptionOptions
    ): EncryptionResult => {
        const salt: string = options?.salt ?? getRandNanoId()
        const buffer: Buffer = Buffer.from(
            data,
            options?.buffer_encoding ?? "utf-8"
        )
        const hash = pbkdf2Sync(
            buffer,
            salt,
            options?.interation ?? 2500,
            options?.key_len ?? 64,
            options?.algorithm ?? "sha256",
        ).toString('base64')
        return { salt, hash }
    }
    export const verify = (
        data: string,
        salt: string,
        comparedHash: string,
    ): boolean => {
        const { hash } = encryption(data, { salt })
        return hash === comparedHash
    }
    export const encryptionFromIv = (data: string)=> {
        if(!private_key) return null

        const private_iv = getRandNanoId(32)
        const cipher = createCipheriv("aes-256-cbc", private_key, private_iv)
        let hash = cipher.update(data, "utf8", "hex")
        
        hash = hash + cipher.final("hex")
        return { hash, private_iv }
    }
    export const decryptionFromIv = (hash: string, iv: string & tags.MaxLength<32>) => {
        if(!private_key) return null

        const decipher = createDecipheriv("aes-256-cbc", private_key, iv)
        let data = decipher.update(hash, "hex", "utf8")
        return data + decipher.final("utf8")
    }
}

import { tags } from "typia"

export type EncryptionResult = {
    salt: string & tags.MinLength<32> & tags.MaxLength<34>
    hash: string & tags.MinLength<32> & tags.MaxLength<66>
}

export type EncryptionOptions = Partial<{
    salt: string & tags.MinLength<32> & tags.MaxLength<34>
    buffer_encoding: BufferEncoding
    str_encoding: BufferEncoding
    interation: number & tags.MinLength<10000> & tags.MaxLength<100000>
    key_len: number & tags.MinLength<32> & tags.MaxLength<64>
    algorithm: EncryptionDigest
}>

export type EncryptionDigest = 
| "sha224"
| "sha256"
| "sha512"

export type SubStatus = 
| "NotEqualPass" 
| "TypeException" 
| "ForgeryData" 
| "ExpiredToken" 
| "NotValidCode"
| "Duplicated"
| "UnAuthorzied"
| "IsAreadyAccount"
| "ProtocolThatCannotBeProcessed"

export interface SuccessResponse<T> {
    readonly data: T
    readonly status: number
}

export interface FailedResponse {
    readonly message: string
    readonly status: number
    substatus?: SubStatus
}

export const ERROR : Record<string, FailedResponse> = {
    "Accepted": { status: 202, message: "요청이 성공적으로 전달되었으나 처리가 되지 않을 수 있습니다." },
    "NonAuthoritativeInformation": { status: 203, message: "입력한 정보가 맞는지 한번 더 확인해주세요." },
    "NotFoundData": { status: 204, message: "요청한 자료를 찾을 수 없습니다." },
    "BadRequest": { status: 400, message: "잘못된 요청 입니다." },
    "UnAuthorized": { status: 401, message: "해당 요청에 필요한 자격 증명에 실패 했습니다." },
    "Forbidden": { status: 403, message: "서버에 의해 요청이 차단 되었습니다." },
    "NotFound": { status: 404, message: "요청 페이지 또는 데이터를 찾을 수 없습니다." },
    "MethodNotAllowd": { status: 405, message: "허용되지 않은 메소드 입니다." },
    "RequestTimeOut": { status: 408, message: "서버에 요청시간이 만료 되었습니다." },
    "Conflict": { status: 409, message: "중복된 요청 혹은 연속된 요청으로 해당 요청이 취소 되었습니다." },
    "TooManyRequests": { status: 429, message: "과도한 요청으로 인해 요청이 취소 되었습니다." },
    "InternalServerError": { status: 500, message: "서버 내부에서 오류가 발생하여 요청이 취소 되었습니다." },
    "BadGateway": { status: 502, message: "요청을 처리하지 못했습니다.\n네트워크 장치를 확인 한 이후에 다시 시도해주세요." },
    "ServiceUnavailableException": { status: 503, message: "현재 해당 요청을 처리할 수 없습니다.\n나중에 다시 시도해주세요."},
    "ServerDatabaseError": { status: 5000, message: "서버에 상태가 불안정해 정보를 가져올 수 없습니다." },
    "ServerCacheError": { status: 5001, message: "서버에 상태가 불안정해 정보를 가져올 수 없습니다." },
    "FailedSendMail": { status: 5001, message: "서버에 상태가 불안정해 메일전송에 실패했습니다." },
}