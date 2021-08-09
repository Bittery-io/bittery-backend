import { Response } from 'express-serve-static-core';
import { createUserBtcpayServices } from '../domain/services/btcpay/btcpay-service';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { ErrorDto } from './dto/error-dto';
import { UserBtcpayException } from '../domain/services/btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../domain/services/btcpay/user-btcpay-error-type';
import { CreateUserBtcpayDto } from './dto/create-user-btcpay-dto';
import { logError, logInfo } from '../application/logging-service';
import { Authorized, Body, HeaderParam, JsonController, Post, Res } from 'routing-controllers';

@JsonController('/btcpay')
@Authorized()
export class BtcpayController {

    @Post('/')
    async createUserBtcpayApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response,
            @Body({ required: true }) createUserBtcpayDto: CreateUserBtcpayDto) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            logInfo(`Starting creating BTCPAY user services for email ${userEmail}`);
            await createUserBtcpayServices(userEmail, createUserBtcpayDto);
            logInfo(`Successfully created user BTCPAY services for email ${userEmail}`);
            return res.status(200).send();
        } catch (err) {
            if (err instanceof UserBtcpayException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError('Failed to add user BTCPAY services services', err);
            return res.status(500).send(new ErrorDto('LND services creation failed',
                UserBtcpayErrorType.BTCPAY_INIT_FAILED_SERVER_ERROR));
        }
    }
}
