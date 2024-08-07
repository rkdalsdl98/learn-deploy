import { 
    DefaultArgs, 
    PrismaClientKnownRequestError 
} from "@prisma/client/runtime/library"
import { 
    Prisma, 
    PrismaClient 
} from "@prisma/client"

import { Logger } from "@nestjs/common"
const logger: Logger = new Logger("UserProvider")

import { ERROR, PrismaService } from "../utils"

export namespace ProfileProvider {
    export namespace Exception {
        export const handle = (e: any) => {
            if(e instanceof PrismaClientKnownRequestError) {
                if(e.code >= "P1000" && e.code <= "P1999") PrismaService.handlePrismaKnownRequestCommonException(e, "Server")
                else if(e.code >= "P2000" && e.code <= "P2999") PrismaService.handlePrismaKnownRequestQueryException(e)
                else logger.error(e.message)
                throw ERROR.ServerDatabaseError
            } else throw e
        }
    }

    export namespace Entity {
        export const toJson = (
            entity: Prisma.profileGetPayload<ReturnType<typeof select>> | null
        ) => {
            if(!entity) return null
            return {
                uid: entity.uid,
                nickname: entity.nickname,
                user_email: entity.user_email,
                createdAt: entity.createdAt,
                updatedAt: entity.updatedAt,
            } satisfies ProfileEntity
        }
        export const select = 
        () => Prisma.validator<Prisma.profileFindManyArgs>()({
            include: { user: false }
        })
    }

    export namespace Query {
        export const update = (
            args: Prisma.profileUpdateArgs,
            tx: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
        ) => (tx ?? PrismaService.prisma)
        .profile
        .update({
            ...args,
            include: Entity.select().include,
        })
        .then(Entity.toJson)
        .catch(Exception.handle)
    }
}

import { tags } from "typia"

export interface ProfileEntity {
    uid: string & tags.MaxLength<64>
    nickname: string & tags.MaxLength<10>
    user_email: string & tags.Format<"email">
    createdAt: Date
    updatedAt: Date
}