export class PasswordResetDto {
    email: string;

    constructor(email: string) {
        this.email = email;
    }
}
