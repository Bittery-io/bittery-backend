import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { getUserBtcWallet } from '../domain/services/btc/user-btc-wallet-service';
import { Authorized, Get, HeaderParam, JsonController, Res } from 'routing-controllers/index';
import { logError, logInfo } from '../application/logging-service';
import { StandardWalletSeedDto } from './dto/wallet/standard-wallet-seed-dto';
import { UserBtcWalletDto } from './dto/wallet/user-btc-wallet-dto';
import { findStandardWalletSeedEncryptedArtefact } from '../domain/repository/encrypted/user-encrypted-store-artefacts-repository';

@JsonController('/wallet')
@Authorized()
export class WalletController {

    @Get('')
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

    @Get('/seed')
    async getStandardWalletSeed(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Res() res: Response) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        const standardWalletSeed: string | undefined = await findStandardWalletSeedEncryptedArtefact(userEmail);
        if (standardWalletSeed) {
            logInfo(`Return standard wallet seed for ${userEmail} `);
            return res.status(200).send(new StandardWalletSeedDto(standardWalletSeed));
        } else {
            logError(`Failed to get standard wallet seed for email ${userEmail} because seed was not found for default store`);
        }
    }

}
