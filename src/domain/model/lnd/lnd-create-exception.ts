import { LndCreationErrorType } from './lnd-creation-error-type';

export class LndCreateException extends Error {
    clientErrorCode: LndCreationErrorType;

    constructor(m: string, clientErrorCode: LndCreationErrorType) {
        super(m);
        this.clientErrorCode = clientErrorCode;
        Object.setPrototypeOf(this, LndCreateException.prototype);
    }
}
