import { IsEmail, IsString } from 'class-validator';

export class RegisterUserDto {

    @IsString()
    password: string;

    @IsString()
    repeatPassword: string;

    @IsEmail()
    email: string;

    @IsString()
    captchaCode: string;

    constructor(password: string, repeatPassword: string, email: string, captchaCode: string) {
        this.password = password;
        this.repeatPassword = repeatPassword;
        this.email = email;
        this.captchaCode = captchaCode;
    }
}
