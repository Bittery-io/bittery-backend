import { IsEmail, IsString } from 'class-validator';

export class PasswordResetDto {

    @IsEmail()
    email: string;

    @IsString()
    captchaCode: string;

    constructor(email: string, captchaCode: string) {
        this.email = email;
        this.captchaCode = captchaCode;
    }
}
