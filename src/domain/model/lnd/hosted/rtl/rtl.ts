export class Rtl {
    lndId: string;
    rtlOneTimeInitPassword: string;
    rtlVersion: string;

    constructor(lndId: string, rtlOneTimeInitPassword: string, rtlVersion: string) {
        this.lndId = lndId;
        this.rtlOneTimeInitPassword = rtlOneTimeInitPassword;
        this.rtlVersion = rtlVersion;
    }
}
