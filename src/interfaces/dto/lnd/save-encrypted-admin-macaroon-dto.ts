import { IsDefined, IsString } from 'class-validator';

export class SaveEncryptedAdminMacaroonDto {

    @IsString()
    @IsDefined()
    adminMacaroon: string;

    constructor(adminMacaroon: string) {
        this.adminMacaroon = adminMacaroon;
    }
}
