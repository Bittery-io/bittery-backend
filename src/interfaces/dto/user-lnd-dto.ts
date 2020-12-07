import { LndStatusEnum } from '../../domain/model/lnd/lnd-status-enum';
import { LndType } from '../../domain/model/lnd/lnd-type';
import { HostedLndType } from '../../domain/model/lnd/hosted/hosted-lnd-type';

export class UserLndDto {
    lndId: string;
    lndRestAddress: string;
    lndStatus: LndStatusEnum;
    lndType: LndType;
    hostedLndType?: HostedLndType;
    lndConnectUri?: string;
    lndUrl?: string;
    rtlAddress?: string;
    rtlOneTimeInitPassword?: string;

    constructor(lndId: string, lndRestAddress: string, lndStatus: LndStatusEnum, lndType: LndType,
                hostedLndType?: HostedLndType, lndUrl?: string, lndConnectUri?: string,
                rtlAddress?: string, rtlOneTimeInitPassword?: string) {
        this.lndId = lndId;
        this.lndRestAddress = lndRestAddress;
        this.lndStatus = lndStatus;
        this.lndType = lndType;
        this.hostedLndType = hostedLndType;
        this.lndConnectUri = lndConnectUri;
        this.lndUrl = lndUrl;
        this.rtlAddress = rtlAddress;
        this.rtlOneTimeInitPassword = rtlOneTimeInitPassword;
    }
}
