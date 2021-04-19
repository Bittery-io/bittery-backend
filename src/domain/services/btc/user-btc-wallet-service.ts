import { UserBtcWalletDto } from '../../../interfaces/dto/wallet/user-btc-wallet-dto';
import { findUserBitcoinWallets } from '../../repository/user-bitcoin-wallets-repository';
import { UserBitcoinWallet } from '../../model/btc/user-bitcoin-wallet';

export const getUserBtcWallet = async (userEmail: string): Promise<UserBtcWalletDto | undefined> => {
    const userBitcoinWallets: UserBitcoinWallet[] = await findUserBitcoinWallets(userEmail);
    // so far support only single wallet per user
    if (userBitcoinWallets.length === 1) {
        return new UserBtcWalletDto(userBitcoinWallets[0].rootPublicKey, userBitcoinWallets[0].type);
    } else {
        return undefined;
    }
};
