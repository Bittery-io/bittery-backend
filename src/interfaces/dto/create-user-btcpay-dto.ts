import { IsOptional, IsString } from 'class-validator';

export class CreateUserBtcpayDto {

    @IsOptional()
    @IsString()
    bip49RootPublicKey?: string;

    @IsOptional()
    @IsString()
    electrumMasterPublicKey?: string;

    @IsOptional()
    @IsString()
    encryptedStandardWalletSeed?: string;

    constructor(bip49RootPublicKey?: string, encryptedStandardWalletSeed?: string, electrumMasterPublicKey?: string) {
        this.bip49RootPublicKey = bip49RootPublicKey;
        this.encryptedStandardWalletSeed = encryptedStandardWalletSeed;
        this.electrumMasterPublicKey = electrumMasterPublicKey;
    }
}
