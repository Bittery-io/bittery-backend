export class BtcpayUserAuthToken {
    merchantToken: string;
    privateKey: string;

    constructor(merchantToken: string, privateKey: string) {
        this.merchantToken = merchantToken;
        this.privateKey = privateKey;
    }
}
