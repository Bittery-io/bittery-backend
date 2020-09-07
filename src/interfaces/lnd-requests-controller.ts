import { Authorized, HeaderParam, JsonController, Post, Res } from 'routing-controllers';
import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { logError, logInfo } from '../application/logging-service';
import {
    existsExistingRequestLndRun,
    insertLndRunRequest,
} from '../domain/repository/lnd-run/lnd-run-requests-repository';
import { UserDomain } from '../domain/model/lnd/user-domain';
import { findUserDomain } from '../domain/repository/user-domains-repository';

@JsonController('/lnd/request')
@Authorized()
export class LndRequestsController {

    @Post('/')
    async createLndRequest(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const userDomain: UserDomain | undefined = await findUserDomain(userEmail);
        if (userDomain) {
            const hasAlreadySavedLndRequest: boolean = await existsExistingRequestLndRun(userDomain.userDomain);
            if (hasAlreadySavedLndRequest) {
                logError(`Cannot create lnd request because user ${userEmail} already requested LND and is in waiting list.`);
                return res.status(400).send();
            } else {
                await insertLndRunRequest(userDomain.userDomain);
                logInfo(`Saved LND request for user ${userEmail}.`);
                return res.status(200).send();
            }
        } else {
            logError(`Cannot create lnd request because user ${userEmail} has not Bittery lnd.`);
            return res.status(400).send();
        }
    }
}
