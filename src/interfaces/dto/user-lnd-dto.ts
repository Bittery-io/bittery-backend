import { LndStatusEnum } from '../../domain/model/lnd/lnd-status-enum';

export class UserLndDto {
    lndRestAddress: string;
    rtlAddress: string;
    lndUrl: string;
    lndConnectUrl: string;
    lndStatus: LndStatusEnum;
    rtlInitPassword: string;

    constructor(lndRestAddress: string, rtlAddress: string, lndConnectUrl: string, lndUrl: string,
                lndStatus: LndStatusEnum, rtlInitPassword: string) {
        this.lndRestAddress = lndRestAddress;
        this.rtlAddress = rtlAddress;
        this.lndConnectUrl = lndConnectUrl;
        this.lndUrl = lndUrl;
        this.lndStatus = lndStatus;
        this.rtlInitPassword = rtlInitPassword;
    }
}
