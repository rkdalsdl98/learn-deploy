import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller, Req, Res, UseGuards } from "@nestjs/common";
import { CookieOptions, Request, Response } from "express";

import { AuthGuard } from "../middleware/guard";
import { GetAuthResult, TokenDecorator } from "../middleware";
import { UserService } from "../service/user.service";
import { ERROR } from "../utils";

import * as dotenv from "dotenv"
dotenv.config()

const SECURE = process.env.COOKIE_SECURE === "true"
const HTTPONLY = process.env.COOKIE_HTTPONLY === "true"
const SAMESITE = validate<string>(process.env.COOKIE_SAME_SITE).success ? process.env.COOKIE_SAME_SITE as CookieOptions["sameSite"] : "none"
const MAXAGE = parseInt(process.env.COOKIE_MAX_AGE ?? "0")

@Controller("user")
export default class UserController {
    private readonly deleteCookieOptions: CookieOptions = {
        secure: SECURE,
        httpOnly: HTTPONLY,
        sameSite: SAMESITE,
        path: "/user",
        maxAge: 0,
    }
    private readonly createCookieOptions: CookieOptions = {
        secure: SECURE,
        httpOnly: HTTPONLY,
        sameSite: SAMESITE,
        path: "/user",
        maxAge: MAXAGE,
    }
    constructor(
        private readonly service: UserService
    ){}

    // 토큰을 사용한 로그인은 이미 브라우저에 유저 정보가 있다고 가정하고
    // 토큰의 유효성 검사 결과만 반환

    // 쿠키에 토큰 담기
    @TypedRoute.Post("login")
    public async login(
        @TypedBody() body: Body.LoginArgs,
        @Res() response: Response,
    ) {
        try {
            const { user, accesstoken, refreshtoken } = await this.service.login({
                email: body.email,
                pass: body.pass,
            })
            this._addTokenToCookie(response, "accesstoken", accesstoken)
            this._addTokenToCookie(response, "refreshtoken", refreshtoken)
            
            response.json({
                data: user,
                status: 201,
            })
        } catch(e) { response.json(e) }
    }

    @TypedRoute.Get("confirm/:email")
    public async sendConfirmEmail(
        @TypedParam("email") email: string & tags.Format<"email">
    ) {
        try {
            const result = await this.service.sendConfirmEmail(email)
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Post("confirm")
    public async receiveConfirmEmail(
        @TypedBody() body: Body.ReceiveConfirmEmailArgs
    ) {
        try {
            const result = await this.service.receiveConfirmEmail(
                body.email,
                body.secret,
            )
            return {
                data: result,
                status: 201,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Post("signup")
    public async signUp(
        @Req() request: Request,
        @TypedBody() body: Body.SignUpArgs
    ) {
        try {
            const confirmCode = request.header("Confirm")
            if(confirmCode) {
                const result = await this.service.signUp({
                    email: body.email,
                    code: confirmCode,
                    pass: body.pass,
                    nickname: body.nickname,
                })
                return {
                    data: result,
                    status: 201,
                }
            }
            throw ERROR.Forbidden
        } catch(e) { return e }
    }

    @TypedRoute.Patch("modify")
    @UseGuards(AuthGuard)
    public async editProfile(
        @TokenDecorator.getAuthResult() authResult: GetAuthResult,
        @TypedBody() body: Body.EditProfileArgs,
        @Res() response: Response
    ) {
        try {
            const { payload, isRefreshPayload } = authResult
            const isExpired = payload.expired
            if(isExpired) {
                var err = ERROR.UnAuthorized
                if(isRefreshPayload) err.substatus = "ExpiredToken"
                throw err
            }

            const result = await this.service.editNickname({
                email: payload.data,
                nickname: body.nickname,
            })
            
            response.json({
                data: result,
                status: 200,
            })
        } catch(e) { response.json(e) }
    }

    @TypedRoute.Delete("signout")
    @UseGuards(AuthGuard)
    public async signOut(
        @TokenDecorator.getAuthResult() authResult: GetAuthResult,
        @Res() response: Response,
    ) {
        try {
            const { payload } = authResult
            const isExpired = payload.expired
            if(isExpired) throw ERROR.UnAuthorized

            const result = await this.service.signOut({ email: payload.data })
            this._deleteTokenFromCookie(response)

            response.json({
                data: result,
                status: 200,
            })
        } catch(e) { response.json(e) }
    }

    private _addTokenToCookie(
        response: Response,
        key: string,
        token: string,
    ) {
        response
        .cookie(
            key,
            token,
            this.createCookieOptions
        )
    }

    private _deleteTokenFromCookie(response: Response) {
        response
        .cookie(
            "accesstoken",
            null,
            this.deleteCookieOptions
        )
        .cookie(
            "refreshtoken",
            null,
            this.deleteCookieOptions
        )
    }
}

import { tags, validate } from "typia"

namespace Body {
    export interface LoginArgs {
        email: string & tags.Format<"email">
        pass: string
    }
    export interface SignUpArgs {
        email: string & tags.Format<"email">
        pass: string
        nickname: string & tags.MaxLength<10>
    }
    export interface ReceiveConfirmEmailArgs {
        email: string & tags.Format<"email">
        secret: string & tags.MaxLength<6>
    }
    export interface EditProfileArgs {
        nickname: string & tags.MaxLength<10>
    }
}