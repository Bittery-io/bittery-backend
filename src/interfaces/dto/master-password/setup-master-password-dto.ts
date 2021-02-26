import { IsDefined, IsHash, IsNotEmpty } from 'class-validator';

export class SetupMasterPasswordDto {

    @IsDefined()
    @IsNotEmpty()
    @IsHash('sha256')
    sha256PasswordProof: string;

    constructor(sha256PasswordProof: string) {
        this.sha256PasswordProof = sha256PasswordProof;
    }
}
