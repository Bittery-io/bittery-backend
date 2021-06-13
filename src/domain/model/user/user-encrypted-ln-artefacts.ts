export class UserEncryptedLnArtefacts {
    userEmail: string;
    lndId: string;
    adminMacaroonHex: string;
    lnSeed: string;
    lnPassword: string;

    constructor(userEmail: string, lndId: string, adminMacaroonHex: string, lnSeed: string, lnPassword: string) {
        this.userEmail = userEmail;
        this.lndId = lndId;
        this.adminMacaroonHex = adminMacaroonHex;
        this.lnSeed = lnSeed;
        this.lnPassword = lnPassword;
    }
}
