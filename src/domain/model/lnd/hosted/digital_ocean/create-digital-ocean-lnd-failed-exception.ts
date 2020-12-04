import { DigitalOceanLndDeploymentStageType } from './digital-ocean-lnd-deployment-stage-type';

export class CreateDigitalOceanLndFailedException extends Error {
    failedDeploymentStage: DigitalOceanLndDeploymentStageType;
    dropletName: string;
    dropletId?: number;
    dropletIpPublic?: string;
    rtlOneTimeInitPassword?: string;

    constructor(failedDeploymentStage: DigitalOceanLndDeploymentStageType, dropletName: string,
                dropletId?: number, dropletIpPublic?: string, rtlOneTimeInitPassword?: string) {
        super();
        this.failedDeploymentStage = failedDeploymentStage;
        this.dropletName = dropletName;
        this.dropletId = dropletId;
        this.dropletIpPublic = dropletIpPublic;
        this.rtlOneTimeInitPassword = rtlOneTimeInitPassword;
        Object.setPrototypeOf(this, CreateDigitalOceanLndFailedException.prototype);
    }
}
