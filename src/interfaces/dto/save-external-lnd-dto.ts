import { IsHexadecimal, IsString } from 'class-validator';

export class SaveExternalLndDto {

    @IsString()
    @IsHexadecimal()
    macaroonHex: string;

    @IsString()
    lndRestAddress: string;

    @IsString()
    tlsCertFileText: string;

    constructor(macaroonHex: string, tlsCertFileText: string, lndRestAddress: string) {
        this.macaroonHex = macaroonHex;
        this.tlsCertFileText = tlsCertFileText;
        this.lndRestAddress = lndRestAddress;
    }
}
