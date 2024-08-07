import { 
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable, 
    NestInterceptor,
} from "@nestjs/common";
import { 
    catchError,
    Observable,
    of,
    tap
} from "rxjs";
import { validate } from "typia";
import { 
    ERROR, 
    FileSystem, 
    getRequestIP, 
    handleException
} from "../../utils";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    public intercept(
        context: ExecutionContext, 
        next: CallHandler<any>
    ): Observable<any> {
        const req = context.switchToHttp().getRequest()
        const reqAddress: string | undefined = getRequestIP(req)
        if(!reqAddress) {
            var err = ERROR.UnAuthorized
            var message = "[유효하지 않은 요청]: 아이피를 확인 할 수 없는 요청이 확인되었습니다."
            FileSystem.append("logs", "guard.txt", message)
            throw new HttpException(err.message, err.status)
        }
        
        const { path, methods } = req.route
        if(!methods || methods.length < 1) {
            var err = ERROR.UnAuthorized
            var message = `[유효하지 않은 요청]: 메소드를 알 수 없는 요청이 확인되었습니다.\n[요청 아이피]: ${reqAddress}`
            FileSystem.append("logs", "guard.txt", message)
            throw new HttpException(err.message, err.status)
        }
        
        const method = Object.keys(methods)[0]
        const before = Date.now()
        const requestTimeLog = `[요청 ${Intl.DateTimeFormat('kr').format(before)}]: ${validate<LocalAddress>(reqAddress).success ? "localhost" : reqAddress} :[${path} : ${method}]`
        return next
        .handle()
        .pipe(
            tap(_=> {
                const successLog = `[요청 처리 성공] ${ Date.now() - before}/ms`
                FileSystem.append("logs", "api.txt", requestTimeLog + "\n" + successLog)
            }),
            catchError((err, _) => {
                const failedLog = `[요청 처리 실패] ${Date.now() - before}/ms`
                return of(handleException(requestTimeLog, failedLog, err))
            })
        )
    }
}

type LocalAddress = "127.0.0.1" | "localhost" | "0.0.0.0"