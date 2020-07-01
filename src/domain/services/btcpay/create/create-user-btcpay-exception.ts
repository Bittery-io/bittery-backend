import { CreateUserBtcpayErrorType } from './create-user-btcpay-error-type';

export class CreateUserBtcpayException extends Error {
    clientErrorCode: CreateUserBtcpayErrorType;

    constructor(m: string, clientErrorCode: CreateUserBtcpayErrorType) {
        super(m);
        this.clientErrorCode = clientErrorCode;
        Object.setPrototypeOf(this, CreateUserBtcpayException.prototype);
    }
}
