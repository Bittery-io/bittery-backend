export class UserPasswordProof {
    userEmail: string;
    sha256PasswordProof: string;
    creationDate: string;

    constructor(userEmail: string, sha256PasswordProof: string, creationDate: string) {
        this.userEmail = userEmail;
        this.sha256PasswordProof = sha256PasswordProof;
        this.creationDate = creationDate;
    }
}
