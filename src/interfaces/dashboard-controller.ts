import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { ErrorDto } from './dto/error-dto';
import { UserBtcpayException } from '../domain/services/btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../domain/services/btcpay/user-btcpay-error-type';
import { logError, logInfo } from '../application/logging-service';
import { Authorized, Get, HeaderParam, JsonController, Res } from 'routing-controllers/index';
import { getDashboardInfo } from '../domain/services/dashboard/dashboard-service';
import { DashboardTimeframeType } from '../domain/model/dashboard/dashboard-timeframe-type';
import { DashboardInfoDto } from './dto/dashboard/dashboard-info-dto';

@JsonController('/dashboard')
@Authorized()
export class BtcpayController {

    @Get('/')
    async getDashboardValues(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Res() res: Response) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            logInfo(`Getting dashboard info for user ${userEmail}`);
            const dashboardInfoDto: DashboardInfoDto =  await getDashboardInfo(userEmail, DashboardTimeframeType.LAST_30_DAYS);
            return res.status(200).send(dashboardInfoDto);
        } catch (err) {
            if (err instanceof UserBtcpayException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError(`Failed to get dashboard info for user ${userEmail}`, err);
            return res.status(500).send(new ErrorDto('Getting dashboard info failed'));
        }
    }
}
