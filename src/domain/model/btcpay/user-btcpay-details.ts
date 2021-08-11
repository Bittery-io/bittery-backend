export class UserBtcpayDetails {
    userEmail: string;
    storeId: string;
    apiKey: string;

    constructor(userEmail: string, storeId: string, apiKey: string) {
        this.userEmail = userEmail;
        this.storeId = storeId;
        this.apiKey = apiKey;
    }
}
