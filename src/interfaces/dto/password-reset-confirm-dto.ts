import { IsEmail, IsString } from 'class-validator';

export class PasswordResetConfirmDto {

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsString()
    repeatPassword: string;

    @IsString()
    captchaCode: string;

    @IsString()
    passwordResetKey: string;

    constructor(password: string, repeatPassword: string, email: string, captchaCode: string, passwordResetKey: string) {
        this.password = password;
        this.repeatPassword = repeatPassword;
        this.email = email;
        this.captchaCode = captchaCode;
        this.passwordResetKey = passwordResetKey;
    }
}
