export class UserRtl {
    userDomain: string;
    rtlInitPassword: string;

    constructor(userDomain: string, rtlInitPassword: string) {
        this.userDomain = userDomain;
        this.rtlInitPassword = rtlInitPassword;
    }
}
