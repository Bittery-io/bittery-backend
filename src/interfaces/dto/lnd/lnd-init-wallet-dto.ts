import { ArrayMaxSize, ArrayMinSize, IsArray, IsDefined, IsString, MinLength } from 'class-validator';

export class LndInitWalletDto {

    @IsDefined()
    @IsString()
    @MinLength(8)
    password: string;

    @IsDefined()
    @IsArray()
    @ArrayMinSize(24)
    @ArrayMaxSize(24)
    seedMnemonic: string[];

    @IsDefined()
    passwordEncrypted: string;

    @IsDefined()
    seedMnemonicEncrypted: string;

    constructor(password: string, seedMnemonic: string[], passwordEncrypted: string, seedMnemonicEncrypted: string) {
        this.password = password;
        this.seedMnemonic = seedMnemonic;
        this.passwordEncrypted = passwordEncrypted;
        this.seedMnemonicEncrypted = seedMnemonicEncrypted;
    }
}
