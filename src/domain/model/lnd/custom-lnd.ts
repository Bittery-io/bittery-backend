export class CustomLnd {
    userEmail: string;
    lndRestAddress: string;
    macaroonHex: string;
    tlsCert: string;
    tlsCertThumbprint: string;

    constructor(userEmail: string, lndRestAddress: string, macaroonHex: string, tlsCert: string, tlsCertThumbprint: string) {
        this.userEmail = userEmail;
        this.lndRestAddress = lndRestAddress;
        this.macaroonHex = macaroonHex;
        this.tlsCert = tlsCert;
        this.tlsCertThumbprint = tlsCertThumbprint;
    }
}
