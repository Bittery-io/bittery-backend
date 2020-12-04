import { HostedLndType } from '../hosted-lnd-type';
import { DigitalOceanLndDeploymentStageType } from './digital-ocean-lnd-deployment-stage-type';

export class DigitalOceanFailure {
    userEmail: string;
    creationDate: string;
    hostedLndType: HostedLndType;
    dropletId?: number;
    dropletName?: string;
    dropletIp?: string;
    rtlOneTimeInitPassword?: string;
    failedDeploymentStage: DigitalOceanLndDeploymentStageType;

    constructor(userEmail: string, creationDate: string, hostedLndType: HostedLndType,
                failedDeploymentStage: DigitalOceanLndDeploymentStageType, dropletId?: number,
                dropletName?: string, dropletIp?: string, rtlOneTimeInitPassword?: string) {
        this.userEmail = userEmail;
        this.creationDate = creationDate;
        this.hostedLndType = hostedLndType;
        this.dropletId = dropletId;
        this.dropletName = dropletName;
        this.dropletIp = dropletIp;
        this.rtlOneTimeInitPassword = rtlOneTimeInitPassword;
        this.failedDeploymentStage = failedDeploymentStage;
    }
}
