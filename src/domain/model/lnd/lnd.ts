import { LndType } from './lnd-type';

export class Lnd {
    lndId: string;
    userEmail: string;
    lndAddress: string;
    lndRestAddress: string;
    tlsCert: string;
    tlsCertThumbprint: string;
    lndVersion: string;
    lndType: LndType;
    creationDate: string;
    macaroonHex?: string;

    constructor(lndId: string, userEmail: string, lndAddress: string, lndRestAddress: string,
                tlsCert: string, tlsCertThumbprint: string, lndVersion: string, lndType: LndType, creationDate: string,
                macaroonHex?: string) {
        this.lndId = lndId;
        this.userEmail = userEmail;
        this.lndAddress = lndAddress;
        this.lndRestAddress = lndRestAddress;
        this.tlsCert = tlsCert;
        this.tlsCertThumbprint = tlsCertThumbprint;
        this.lndVersion = lndVersion;
        this.lndType = lndType;
        this.creationDate = creationDate;
        this.macaroonHex = macaroonHex;
    }
}
