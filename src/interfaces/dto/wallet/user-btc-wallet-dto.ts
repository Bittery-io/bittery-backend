import { UserBitcoinWalletTypeEnum } from '../../../domain/model/btc/user-bitcoin-wallet-type-enum';

export class UserBtcWalletDto {
    rootPublicKey: string;
    type: UserBitcoinWalletTypeEnum;

    constructor(rootPublicKey: string, type: UserBitcoinWalletTypeEnum) {
        this.rootPublicKey = rootPublicKey;
        this.type = type;
    }
}
