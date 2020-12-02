import { LndType } from './lnd-type';
import { Rtl } from './hosted/rtl/rtl';

export class Lnd {
    lndId: string;
    userEmail: string;
    lndAddress: string;
    lndRestAddress: string;
    tlsCert: string;
    tlsCertThumbprint: string;
    lndVersion: string;
    lndType: LndType;
    macaroonHex?: string;
    rtl?: Rtl;

    constructor(lndId: string, userEmail: string, lndAddress: string, lndRestAddress: string,
                tlsCert: string, tlsCertThumbprint: string, lndVersion: string, lndType: LndType, macaroonHex?: string, rtl?: Rtl) {
        this.lndId = lndId;
        this.userEmail = userEmail;
        this.lndAddress = lndAddress;
        this.lndRestAddress = lndRestAddress;
        this.tlsCert = tlsCert;
        this.tlsCertThumbprint = tlsCertThumbprint;
        this.lndVersion = lndVersion;
        this.lndType = lndType;
        this.macaroonHex = macaroonHex;
        this.rtl = rtl;
    }
}
