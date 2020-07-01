export class SaveUserLndDto {
    macaroonHex: string;
    lndRestAddress: string;
    tlsCertFileText: string;

    constructor(macaroonHex: string, tlsCertFileText: string, lndRestAddress: string) {
        this.macaroonHex = macaroonHex;
        this.tlsCertFileText = tlsCertFileText;
        this.lndRestAddress = lndRestAddress;
    }
}
