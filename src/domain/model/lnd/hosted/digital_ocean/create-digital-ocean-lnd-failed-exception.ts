import { DigitalOceanLndDeploymentStageType } from './digital-ocean-lnd-deployment-stage-type';

export class CreateDigitalOceanLndFailedException extends Error {
    failedDeploymentStage: DigitalOceanLndDeploymentStageType;
    dropletName: string;
    dropletId?: number;
    dropletIpPublic?: string;
    rtlOneTimeInitPassword?: string;
    errorMessage?: string;

    constructor(failedDeploymentStage: DigitalOceanLndDeploymentStageType, dropletName: string,
                errorMessage?: string,
                dropletId?: number, dropletIpPublic?: string, rtlOneTimeInitPassword?: string) {
        super();
        this.failedDeploymentStage = failedDeploymentStage;
        this.dropletName = dropletName;
        this.errorMessage = errorMessage;
        this.dropletId = dropletId;
        this.dropletIpPublic = dropletIpPublic;
        this.rtlOneTimeInitPassword = rtlOneTimeInitPassword;
        Object.setPrototypeOf(this, CreateDigitalOceanLndFailedException.prototype);
    }
}
