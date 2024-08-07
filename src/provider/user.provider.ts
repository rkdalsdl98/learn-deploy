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

export namespace UserProvider {
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
            entity: Prisma.userGetPayload<ReturnType<typeof select>>
        ) => {
            if(!entity) return null
            return {
                uid: entity.uid,
                email: entity.email,
                pass: entity.pass,
                salt: entity.salt,
                profile: ProfileProvider.Entity.toJson(entity.profile),
            } satisfies UserEntity
        }

        export const select = 
        () => Prisma.validator<Prisma.userFindManyArgs>()({
            include: { 
                profile: ProfileProvider.Entity.select()
            }
        })
    }

    export namespace Query {
        export const findUnique = async (
            args: Prisma.userFindUniqueArgs,
            tx?: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
        ) => await (tx ?? PrismaService.prisma)
        .user
        .findUnique({
            ...args,
            include: Entity.select().include,
        })
        .then(Entity.toJson)
        .catch(Exception.handle)

        export const update = async (
            args: Pick<Prisma.userUpdateArgs, "data"> & { where: Prisma.userWhereUniqueInput },
            tx?: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
        ) => await (tx ?? PrismaService.prisma)
        .user
        .update({
            ...args,
            include: Entity.select().include,
        })
        .then(Entity.toJson)
        .catch(Exception.handle)

        export const create = async (
            args: Prisma.userCreateArgs,
            tx?: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
        ) => await (tx ?? PrismaService.prisma)
        .user
        .create({
            ...args,
            include: Entity.select().include,
        })
        .then(Entity.toJson)
        .catch(Exception.handle)

        export const remove = async (
            args: Prisma.userDeleteArgs,
            tx?: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
        ) => {
            return await (tx ?? PrismaService.prisma)
            .user
            .delete({
                where: { email: "rkdalsdl112@gmail.com" }
            })
            .then(Entity.toJson)
            .catch(Exception.handle)
        }
    }
}

import { tags } from "typia"
import { ProfileEntity, ProfileProvider } from "./profile.provider"

export interface UserEntity {
    uid: string
    email: string & tags.Format<"email">
    pass: string & tags.MaxLength<100>
    salt: string & tags.MaxLength<34>
    profile: ProfileEntity | null
}