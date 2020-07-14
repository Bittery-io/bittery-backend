
export class User {
    email: string;
    encodedPassword: string;
    active: boolean;
    creationDate: string;

    constructor(email: string, encodedPassword: string, active: boolean, creationDate: string) {
        this.email = email;
        this.encodedPassword = encodedPassword;
        this.active = active;
        this.creationDate = creationDate;
    }
}
