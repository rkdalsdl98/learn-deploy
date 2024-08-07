import { 
    CanActivate, 
    ExecutionContext, 
    HttpException, 
} from "@nestjs/common";
import { 
    ERROR, 
    extractTokenFromCookie, 
    FileSystem,
    getRequestIP,
    jwtFactory,
} from "../../utils";

export class AuthGuard implements CanActivate {
    public canActivate(context: ExecutionContext) : boolean {
        const req = context.switchToHttp().getRequest()
        const reqAddress: string | undefined = getRequestIP(req)
        const { methods } = req.route
        const method = Object.keys(methods)[0]
        const tokens = extractTokenFromCookie(req)

        if(!tokens) {
            var err = ERROR.UnAuthorized
            var message = `${method}\n[토큰이 존재하지 않음]: 권한 인증에 필요한 토큰이 존재하지 않아 요청을 차단했습니다.\n[요청 아이피]: ${reqAddress}`
            FileSystem.append("logs", "guard.txt", message)
            throw new HttpException(err.message, err.status)
        }

        try {
            const { accesstoken, refreshtoken } = tokens
            const access_payload = jwtFactory.VerifyToken(accesstoken)

            if(!accesstoken || access_payload.expired) {
                const refresh_payload = jwtFactory.VerifyToken(refreshtoken)
                req.user = { payload: refresh_payload, isRefreshPayload: true }
            } else req.user = { payload: access_payload, isRefreshPayload: false }
        } catch(e) {
            var err = ERROR.UnAuthorized
            var message = `${method}\n[유효하지 않은 토큰으로 요청]: 서버에서 발급한 토큰이 아니거나 오염된 토큰으로 요청이 들어왔습니다.\n[요청 아이피]: ${reqAddress}`
            FileSystem.append("logs", "guard.txt", message)
            if("message" in e && "status" in e) throw new HttpException(e.message, e.status)
            throw new HttpException(err.message, err.status)
        }
        return true
    }
}