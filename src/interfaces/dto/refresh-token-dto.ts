import { IsString } from 'class-validator';

export class RefreshTokenDto {

    @IsString()
    refreshToken: string;

    constructor(refreshToken: string) {
        this.refreshToken = refreshToken;
    }
}
