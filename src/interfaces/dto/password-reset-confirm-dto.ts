export class PasswordResetConfirmDto {
    email: string;
    password: string;
    repeatPassword: string;
    captchaCode: string;
    passwordResetKey: string;

    constructor(password: string, repeatPassword: string, email: string, captchaCode: string, passwordResetKey: string) {
        this.password = password;
        this.repeatPassword = repeatPassword;
        this.email = email;
        this.captchaCode = captchaCode;
        this.passwordResetKey = passwordResetKey;
    }
}
