export class UserPasswordProof {
    userEmail: string;
    sha256PasswordProof: string;

    constructor(userEmail: string, sha256PasswordProof: string) {
        this.userEmail = userEmail;
        this.sha256PasswordProof = sha256PasswordProof;
    }
}
