import { Request, Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { UserBtcWalletDto } from './dto/user-btc-wallet-dto';
import { getUserBtcWallet } from '../domain/services/btc/user-btc-wallet-service';

export const getUserBtcWalletApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    const userBtcWalletDto: UserBtcWalletDto | undefined = await getUserBtcWallet(userEmail);
    if (userBtcWalletDto) {
        return res.send(userBtcWalletDto);
    } else {
        return res.status(404).send();
    }
};
