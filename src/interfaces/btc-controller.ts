import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { UserBtcWalletDto } from './dto/user-btc-wallet-dto';
import { getUserBtcWallet } from '../domain/services/btc/user-btc-wallet-service';
import { Authorized, Get, HeaderParam, JsonController, Res } from 'routing-controllers/index';

@JsonController('/btc')
@Authorized()
export class BtcController {

    @Get('/wallet')
    async getUserBtcWalletApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const userBtcWalletDto: UserBtcWalletDto | undefined = await getUserBtcWallet(userEmail);
        if (userBtcWalletDto) {
            return res.send(userBtcWalletDto);
        } else {
            return res.status(404).send();
        }
    }
}
