import { IsDefined, IsString } from 'class-validator';

export class LndInitWalletResponseDto {

    @IsString()
    @IsDefined()
    adminMacaroon: string;

    constructor(adminMacaroon: string) {
        this.adminMacaroon = adminMacaroon;
    }
}
