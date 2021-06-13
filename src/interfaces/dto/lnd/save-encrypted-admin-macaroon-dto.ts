import { IsDefined, IsString } from 'class-validator';

export class SaveEncryptedAdminMacaroonDto {

    @IsString()
    @IsDefined()
    encryptedAdminMacaroonHex: string;

    constructor(adminMacaroon: string) {
        this.encryptedAdminMacaroonHex = adminMacaroon;
    }
}
