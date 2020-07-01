export class JwtToken {
    accessToken: string;
    refreshToken: string;
    expireIn: number;
    userEmail: string;

    constructor(accessToken: string, refreshToken: string, expireIn: number, userEmail: string) {
        this.refreshToken = refreshToken;
        this.accessToken = accessToken;
        this.expireIn = expireIn;
        this.userEmail = userEmail;
    }
}
