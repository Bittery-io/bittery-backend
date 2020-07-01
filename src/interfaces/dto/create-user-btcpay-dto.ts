export class CreateUserBtcpayDto {
    bip49RootPublicKey: string;

    constructor(bip49RootPublicKey: string) {
        this.bip49RootPublicKey = bip49RootPublicKey;
    }
}
