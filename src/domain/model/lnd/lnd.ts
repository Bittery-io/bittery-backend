import { LndType } from './lnd-type';

export class Lnd {
    lndId: string;
    userEmail: string;
    // lndIpAddress: string;
    lndRestAddress: string;
    tlsCert: string;
    tlsCertThumbprint: string;
    lndVersion: string;
    lndType: LndType;
    creationDate: string;
    macaroonHex?: string;

    constructor(lndId: string, userEmail: string, lndRestAddress: string,
                tlsCert: string, tlsCertThumbprint: string, lndVersion: string, lndType: LndType, creationDate: string,
                macaroonHex?: string) {
        this.lndId = lndId;
        this.userEmail = userEmail;
        // this.lndIpAddress = lndIpAddress;
        this.lndRestAddress = lndRestAddress;
        this.tlsCert = tlsCert;
        this.tlsCertThumbprint = tlsCertThumbprint;
        this.lndVersion = lndVersion;
        this.lndType = lndType;
        this.creationDate = creationDate;
        this.macaroonHex = macaroonHex;
    }
}
