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

    constructor(password: string, seedMnemonic: string[]) {
        this.password = password;
        this.seedMnemonic = seedMnemonic;
    }
}
