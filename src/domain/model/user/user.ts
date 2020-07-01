
export class User {
    email: string;
    encodedPassword: string;
    active: boolean;

    constructor(email: string, encodedPassword: string, active: boolean) {
        this.email = email;
        this.encodedPassword = encodedPassword;
        this.active = active;
    }
}
