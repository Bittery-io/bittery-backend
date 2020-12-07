import { IsDefined, IsString } from 'class-validator';

export class UnlockLndDto {

    @IsDefined()
    @IsString()
    password: string;

    constructor(password: string) {
        this.password = password;
    }
}
