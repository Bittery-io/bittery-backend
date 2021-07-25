import { LndType } from './lnd-type';

export class Lnd {
    lndId: string;
    userEmail: string;
    lndRestAddress: string;
    tlsCert: string;
    tlsCertThumbprint: string;
    lndVersion: string;
    lndType: LndType;
    creationDate: string;
    isActive: boolean;
    macaroonHex?: string;

    constructor(lndId: string, userEmail: string, lndRestAddress: string,
                tlsCert: string, tlsCertThumbprint: string, lndVersion: string, lndType: LndType, creationDate: string,
                isActive: boolean, macaroonHex?: string) {
        this.lndId = lndId;
        this.userEmail = userEmail;
        this.lndRestAddress = lndRestAddress;
        this.tlsCert = tlsCert;
        this.tlsCertThumbprint = tlsCertThumbprint;
        this.lndVersion = lndVersion;
        this.lndType = lndType;
        this.creationDate = creationDate;
        this.isActive = isActive;
        this.macaroonHex = macaroonHex;
    }
}
