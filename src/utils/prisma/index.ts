import { Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { ERROR } from "../auth";


const logger: Logger = new Logger("PrismaService")

export class PrismaService {
    public static readonly prisma: PrismaClient = new PrismaClient()
    
    public static async execute(
        access_db: string,
        username: string,
        password: string,
        script: string,
    ) 
    : Promise<void> {
        try {
            const conn = new PrismaClient({
                datasourceUrl: `postgresql://${username}:${password}@localhost:5432/${access_db}`
            })
            const queries: string[] =
            script
            .split("\n")
            .map(str => str.trim())
            .filter(str => !!str)

            queries.forEach(async query => {
                try {
                    await conn.$executeRawUnsafe(query)
                } catch(e) {
                    if(e instanceof PrismaClientKnownRequestError) {
                        if(e.code >= "P1000" && e.code <= "P1999") this.handlePrismaKnownRequestCommonException(e, username)
                        else if(e.code >= "P2000" && e.code <= "P2999") this.handlePrismaKnownRequestQueryException(e)
                        else logger.error(e.message)
                    }
                    await conn.$disconnect()
                    throw ERROR.ServerDatabaseError
                }
            })
            await conn.$disconnect()
        } catch(e) { throw e }
    }

    public static handlePrismaKnownRequestCommonException(
        error: PrismaClientKnownRequestError,
        access_username: string,
    ) {
        switch(error.code) {
            case "P1000":
                logger.error(`${error.name}\n데이터베이스 서버에 대한 인증에 실패 했습니다.\n${error.message}`)
                break
            case "P1001":
                logger.error(`${error.name}\n데이터베이스 서버에 연결할 수 없습니다.\n${error.message}`)    
                break
            case "P1002":
                logger.error(`${error.name}\n데이터베이스 연결시간이 초과 했습니다.\n${error.message}`)
                break
            case "P1008":
                logger.error(`${error.name}\n스크립트 실행시간이 초과 되었습니다.\n${error.message}`)
                break
            case "P1009":
                logger.error(`${error.name}\n${access_username}은 이미 데이터베이스 서버에 접근중 입니다.\n${error.message}`)
                break
            case "P1017":
                logger.error(`${error.name}\n데이터베이스 서버와 연결이 되어 있지 않습니다.\n${error.message}`)
                break
        }
    }
    public static handlePrismaKnownRequestQueryException(error: PrismaClientKnownRequestError) {
        switch(error.code) {
            case "P2000":
                logger.error(`${error.name}\n요소중 접근하려는 열의 조건을 만족하지 못하는 값이 있습니다.\n${error.message}`)
                throw ERROR.NonAuthoritativeInformation
            case "P2001":
                logger.error(`${error.name}\n조건에 해당하는 레코드가 존재하지 않습니다.\n${error.message}`)    
                throw ERROR.NotFound
            case "P2002":
                logger.error(`${error.name}\n${error.message}`)
                var err = ERROR.Accepted
                err.substatus ="IsAreadyAccount"
                throw err
            case "P2003":
            case "P2004":
                logger.error(`${error.name}\n제약 조건을 만족하지 못했습니다.\n${error.message}`)
                throw ERROR.Accepted
            case "P2008":
            case "P2009":
                logger.error(`${error.name}\n스크립트를 다시 한번 확인 해주세요.\n${error.message}`)
                throw ERROR.InternalServerError
            case "P2021":
                logger.error(`${error.name}\n접근하려는 테이블이 존재하지 않습니다.\n${error.message}`)
                throw ERROR.NotFound
            case "P2025":
                logger.error(`${error.name}\n스크립트를 실행할 대상 데이터가 존재 하지 않습니다.\n${error.message}`)
                throw ERROR.NotFoundData
        }
    }
}