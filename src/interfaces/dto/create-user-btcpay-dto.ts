export class CreateUserBtcpayDto {
    bip49RootPublicKey?: string;
    electrumMasterPublicKey?: string;

    constructor(bip49RootPublicKey?: string, electrumMasterPublicKey?: string) {
        this.bip49RootPublicKey = bip49RootPublicKey;
        this.electrumMasterPublicKey = electrumMasterPublicKey;
    }
}
