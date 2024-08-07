import { 
    ISendMailOptions, 
    MailerService, 
} from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";

import * as fs from "fs"
import * as path from "path"

import * as dotenv from "dotenv"
dotenv.config()

const logger: Logger = new Logger("MailerService")
const from_email = process.env.AUTH_EMAIL

@Injectable()
export class MyMailerService {
    constructor(
        private readonly mailerService: MailerService
    ){}

    /**
     * html 파일을 읽어와 datas의 key값과 같은 값을 data 값으로 변경하고 완성된 템플릿을 반환
     * readfile이 커널에서 작업을 하는 방식이라 함수가 끝났을 때 작업이 완료됨을 보장 할 수 없어서
     * 내부에서 Promise 방식으로 구현했음
     * @param secret 
     * @returns 
     */
    private _getAuthMailTemplate(secret: string): Promise<string> {
        return new Promise((res, rej) => {
            const datas = {
                secret,
                ttl: parseInt(process.env.EMAIL_TTL ?? "120") / 60,
            }

            fs.readFile(
                path.join("public/template/mail_template.html"), 
                "utf8", 
                (err, html) => {
                    if(err) {
                        logger.log(`회원가입 인증메일 전송에 실패했습니다.\n${err}`)
                        rej(err)
                        return
                    }
    
                    const keys = Object.keys(datas)
                    for(let i=0; i<keys.length; ++i) html = html.replace(new RegExp(`\\$\\{${keys[i]}\\}`, 'g'), datas[keys[i]])
                    
                    res(html)
                }
            )
        })
    }

    public async sendMail(args: SendAuthMailArgs) {
        const html = await this._getAuthMailTemplate(args.secret)
        if(!html) throw typeof ERROR.Accepted

        const config: ISendMailOptions = {
            to: args.to,
            subject: "HarpSeal 가입 인증메일",
            html,
        }
        return await this.mailerService.sendMail(config)
    }
}

import { tags } from "typia"
import { ERROR } from "../auth";

export type SendAuthMailArgs = {
    to: string & tags.Format<"email">
    secret: string
}