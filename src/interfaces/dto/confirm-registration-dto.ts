export class ConfirmRegistrationDto {
    email: string;
    signUpKey: string;

    constructor(email: string, signUpKey: string) {
        this.email = email;
        this.signUpKey = signUpKey;
    }
}
