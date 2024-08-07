import { 
    createParamDecorator, 
    ExecutionContext 
} from "@nestjs/common";
import { Payload } from "../../utils";

export namespace TokenDecorator {
    export const getAuthResult = createParamDecorator((
        _,
        context: ExecutionContext,
    ) : GetAuthResult => {
        const { user: result } = context.switchToHttp().getRequest()
        return result
    })
}

export interface GetAuthResult {
    payload: Payload
    isRefreshPayload: boolean
}