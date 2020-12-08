import { LndStatusEnum } from '../../domain/model/lnd/lnd-status-enum';
import { LndType } from '../../domain/model/lnd/lnd-type';
import { HostedLndType } from '../../domain/model/lnd/hosted/hosted-lnd-type';
import { LndInfo } from '../../domain/model/lnd/api/lnd-info';

export class UserLndDto {
    lndId: string;
    lndRestAddress: string;
    lndStatus: LndStatusEnum;
    lndType: LndType;
    hostedLndType?: HostedLndType;
    lndConnectUri?: string;
    rtlAddress?: string;
    rtlOneTimeInitPassword?: string;
    lndInfo?: LndInfo;

    constructor(lndId: string, lndRestAddress: string, lndStatus: LndStatusEnum, lndType: LndType,
                hostedLndType?: HostedLndType, lndConnectUri?: string,
                rtlAddress?: string, rtlOneTimeInitPassword?: string, lndInfo?: LndInfo) {
        this.lndId = lndId;
        this.lndRestAddress = lndRestAddress;
        this.lndStatus = lndStatus;
        this.lndType = lndType;
        this.hostedLndType = hostedLndType;
        this.lndConnectUri = lndConnectUri;
        this.rtlAddress = rtlAddress;
        this.rtlOneTimeInitPassword = rtlOneTimeInitPassword;
        this.lndInfo = lndInfo;
    }
}
