import { DisableSubscriptionStageErrorType } from './disable-subscription-stage-error-type';

export class DisableSubscriptionException extends Error {
    failedDeploymentStage: DisableSubscriptionStageErrorType;

    constructor(message: string, failedDeploymentStage: DisableSubscriptionStageErrorType) {
        super(message);
        this.failedDeploymentStage = failedDeploymentStage;
    }
}
