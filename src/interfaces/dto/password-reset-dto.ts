export class PasswordResetDto {
    email: string;
    captchaCode: string;

    constructor(email: string, captchaCode: string) {
        this.email = email;
        this.captchaCode = captchaCode;
    }
}
