import { UserLoginErrorType } from './user-login-error-type';

export class UserLoginException extends Error {
    clientErrorCode: UserLoginErrorType;

    constructor(m: string, clientErrorCode: UserLoginErrorType) {
        super(m);
        this.clientErrorCode = clientErrorCode;
        Object.setPrototypeOf(this, UserLoginException.prototype);
    }
}
