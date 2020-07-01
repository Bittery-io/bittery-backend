import { BtcpayUserAuthToken } from './btcpay-user-auth-token';

export class UserBtcpayDetails {
    userEmail: string;
    storeId: string;
    btcpayUserAuthToken: BtcpayUserAuthToken;

    constructor(userEmail: string, storeId: string, btcpayUserAuthToken: BtcpayUserAuthToken) {
        this.userEmail = userEmail;
        this.storeId = storeId;
        this.btcpayUserAuthToken = btcpayUserAuthToken;
    }
}
