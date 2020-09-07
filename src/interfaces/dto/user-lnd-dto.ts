import { LndStatusEnum } from '../../domain/model/lnd/lnd-status-enum';

export class UserLndDto {
    lndRestAddress: string;
    rtlAddress: string;
    lndUrl: string;
    lndConnectUrl: string;
    lndStatus: LndStatusEnum;
    rtlInitPassword: string;

    // these both can be set only if LND is turned off for user
    turnOnRequested?: boolean;

    constructor(lndRestAddress: string, rtlAddress: string, lndConnectUrl: string, lndUrl: string,
                lndStatus: LndStatusEnum, rtlInitPassword: string, turnOnRequested?: boolean) {
        this.lndRestAddress = lndRestAddress;
        this.rtlAddress = rtlAddress;
        this.lndConnectUrl = lndConnectUrl;
        this.lndUrl = lndUrl;
        this.lndStatus = lndStatus;
        this.rtlInitPassword = rtlInitPassword;
        this.turnOnRequested = turnOnRequested;
    }
}
