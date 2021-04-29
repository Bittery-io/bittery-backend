export class LndConnectUriDto {
    lndIpAddress: string;
    lndTlsCert: string;
    adminMacaroonEncrypted: string;

    constructor(lndIpAddress: string, lndTlsCert: string, adminMacaroonEncrypted: string) {
        this.lndIpAddress = lndIpAddress;
        this.lndTlsCert = lndTlsCert;
        this.adminMacaroonEncrypted = adminMacaroonEncrypted;
    }
}
