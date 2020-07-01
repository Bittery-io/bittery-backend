import { UserRegistrationErrorType } from './user-registration-error-type';

export class UserRegisterException extends Error {
    clientErrorCode: UserRegistrationErrorType;

    constructor(m: string, clientErrorCode: UserRegistrationErrorType) {
        super(m);
        this.clientErrorCode = clientErrorCode;
        Object.setPrototypeOf(this, UserRegisterException.prototype);
    }
}
