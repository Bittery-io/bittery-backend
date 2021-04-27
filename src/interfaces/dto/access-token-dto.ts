export class AccessTokenDto {
    accessToken: string;
    refreshToken: string;
    expireSeconds: number;

    constructor(accessToken: string, refreshToken: string, expireSeconds: number) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expireSeconds = expireSeconds;
    }
}
