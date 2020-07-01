export class RegisterUserDto {
    password: string;
    repeatPassword: string;
    email: string;
    captchaCode: string;

    constructor(password: string, repeatPassword: string, email: string, captchaCode: string) {
        this.password = password;
        this.repeatPassword = repeatPassword;
        this.email = email;
        this.captchaCode = captchaCode;
    }
}
