import { UserBtcpayErrorType } from './user-btcpay-error-type';

export class UserBtcpayException extends Error {
    clientErrorCode: UserBtcpayErrorType;

    constructor(m: string, clientErrorCode: UserBtcpayErrorType) {
        super(m);
        this.clientErrorCode = clientErrorCode;
        Object.setPrototypeOf(this, UserBtcpayException.prototype);
    }
}
