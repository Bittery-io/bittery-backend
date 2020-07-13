import { UserBitcoinWalletTypeEnum } from './user-bitcoin-wallet-type-enum';

export class UserBitcoinWallet {
    userEmail: string;
    storeId: string;
    rootPublicKey: string;
    type: UserBitcoinWalletTypeEnum;
    creationDate: string;

    constructor(userEmail: string, storeId: string, rootPublicKey: string, type: UserBitcoinWalletTypeEnum, creationDate: string) {
        this.userEmail = userEmail;
        this.storeId = storeId;
        this.rootPublicKey = rootPublicKey;
        this.type = type;
        this.creationDate = creationDate;
    }
}
