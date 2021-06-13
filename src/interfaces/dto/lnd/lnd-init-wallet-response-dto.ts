import { IsDefined, IsString } from 'class-validator';

export class LndInitWalletResponseDto {

    @IsString()
    @IsDefined()
    adminMacaroonHex: string;

    constructor(adminMacaroonHex: string) {
        this.adminMacaroonHex = adminMacaroonHex;
    }
}
