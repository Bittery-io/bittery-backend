export class UserEncryptedArtefacts {
    userEmail: string;
    lndId: string;
    adminMacaroon: string;

    constructor(userEmail: string, lndId: string, adminMacaroon: string) {
        this.userEmail = userEmail;
        this.lndId = lndId;
        this.adminMacaroon = adminMacaroon;
    }
}
