import { IsDefined, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserBtcpayDto {

    @IsDefined()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    storeName: string;

    @IsOptional()
    @IsString()
    bip49RootPublicKey?: string;

    @IsOptional()
    @IsString()
    electrumMasterPublicKey?: string;

    @IsOptional()
    @IsString()
    encryptedStandardWalletSeed?: string;

    constructor(storeName: string, bip49RootPublicKey?: string, encryptedStandardWalletSeed?: string, electrumMasterPublicKey?: string) {
        this.storeName = storeName;
        this.bip49RootPublicKey = bip49RootPublicKey;
        this.encryptedStandardWalletSeed = encryptedStandardWalletSeed;
        this.electrumMasterPublicKey = electrumMasterPublicKey;
    }
}
