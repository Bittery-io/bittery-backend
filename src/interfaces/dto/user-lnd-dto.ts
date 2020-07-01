import { LndStatusEnum } from '../../domain/model/lnd/lnd-status-enum';

export class UserLndDto {
    lndRestAddress: string;
    rtlAddress: string;
    rtlOneTimePassword?: string;
    lndUrl: string;
    lndConnectUrl: string;
    lndStatus: LndStatusEnum;

    constructor(lndRestAddress: string, rtlAddress: string, lndConnectUrl: string, lndUrl: string,
                lndStatus: LndStatusEnum, rtlOneTimePassword?: string) {
        this.lndRestAddress = lndRestAddress;
        this.rtlAddress = rtlAddress;
        this.lndConnectUrl = lndConnectUrl;
        this.lndUrl = lndUrl;
        this.lndStatus = lndStatus;
        this.rtlOneTimePassword = rtlOneTimePassword;
    }
}
