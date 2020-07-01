export class UserBitcoinWallet {
    userEmail: string;
    storeId: string;
    rootPublicKey: string;
    bip: string;
    creationDate: string;

    constructor(userEmail: string, storeId: string, rootPublicKey: string, bip: string, creationDate: string) {
        this.userEmail = userEmail;
        this.storeId = storeId;
        this.rootPublicKey = rootPublicKey;
        this.bip = bip;
        this.creationDate = creationDate;
    }
}
