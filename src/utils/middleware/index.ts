import { Request } from "express"
import { HttpException } from "@nestjs/common"

import { ERROR, FailedResponse } from "../auth"
import { FileSystem } from "../filesystem"

export const extractAdminKey = (request: Request)
: string | null => {
    const key : string | undefined = request.headers['authorization']
    if(key !== undefined) return key
    return null
}

export const extractTokenFromCookie = (request: Request)
: JwtTokenFromCookie | null => {
    const cookie = request.headers["cookie"]?.split("; ")
    if(cookie !== undefined && cookie.length === 2) {
        const tokens: JwtTokenFromCookie = {
            accesstoken: "",
            refreshtoken: "",
        }

        let cnt = 0
        for(let i=0; i<cookie.length; ++i) {
            const [key, value] = cookie[i].split("=")
            if(key === "accesstoken") {
                ++cnt
                tokens.accesstoken = value
            }
            else if(key === "refreshtoken") {
                ++cnt
                tokens.refreshtoken = value
            }
        }
        return cnt !== 2 ? null : tokens
    }
    return null
}

export const getRequestIP = (req: Request)
: string | undefined => {
    const address: string | undefined = req.socket.remoteAddress
    if(!address) return undefined
    
    const pureAddr = address.match(/([0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})/)
    if(!pureAddr) return "localhost"
    return pureAddr[0]
}

export const handleException = (requestTimeLog:string, logmessage: string, err: any)
: FailedResponse => {
    var error
    var detail
    if(err instanceof HttpException) {
        const res = err.getResponse()
        if(typeof res === 'string') {
            detail = `Path: ${err['path']}\nResponse: ${res}`
            console.log(detail)
        } else {
            detail = `Path: ${err['path']}\nNeed to modify the variable: ${res['path']}\nReason => ${res['reason']}\nmessage: ${res['message']}`
            console.log(detail)
        }
        
        error = ERROR.BadRequest
        error.substatus = "TypeException"
    } else {
        error = {
            message: err.message,
            status: err.status,
            substatus: err.substatus
        } satisfies typeof ERROR
    }

    FileSystem.append("logs", "api.txt", requestTimeLog + "\n" + logmessage + `${detail ? "\n" + detail : ""}`)
    console.log(logmessage)

    return error
}

interface JwtTokenFromCookie { accesstoken: string, refreshtoken: string }