import { LndStatusEnum } from '../../domain/model/lnd/lnd-status-enum';

export class CustomLndDto {
    lndRestAddress: string;
    macaroonHex: string;
    tlsCert: string;
    lndUrl: string;
    lndStatus: LndStatusEnum;

    constructor(lndRestAddress: string, macaroonHex: string, tlsCert: string, lndUrl: string, lndStatus: LndStatusEnum) {
        this.lndRestAddress = lndRestAddress;
        this.macaroonHex = macaroonHex;
        this.tlsCert = tlsCert;
        this.lndUrl = lndUrl;
        this.lndStatus = lndStatus;
    }
}
