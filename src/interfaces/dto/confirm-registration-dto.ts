import { IsEmail, IsString } from 'class-validator';

export class ConfirmRegistrationDto {

    @IsEmail()
    email: string;

    @IsString()
    signUpKey: string;

    constructor(email: string, signUpKey: string) {
        this.email = email;
        this.signUpKey = signUpKey;
    }
}
