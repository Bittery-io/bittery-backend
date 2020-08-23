import { IsOptional, IsString } from 'class-validator';

export class CreateUserBtcpayDto {

    @IsOptional()
    @IsString()
    bip49RootPublicKey?: string;

    @IsOptional()
    @IsString()
    electrumMasterPublicKey?: string;

    constructor(bip49RootPublicKey?: string, electrumMasterPublicKey?: string) {
        this.bip49RootPublicKey = bip49RootPublicKey;
        this.electrumMasterPublicKey = electrumMasterPublicKey;
    }
}
