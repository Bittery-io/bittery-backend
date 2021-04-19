export class UserEncryptedLnArtefacts {
    userEmail: string;
    lndId: string;
    adminMacaroon?: string;
    lnSeed?: string;
    lnPassword?: string;

    constructor(userEmail: string, lndId: string, adminMacaroon?: string, lnSeed?: string, lnPassword?: string) {
        this.userEmail = userEmail;
        this.lndId = lndId;
        this.adminMacaroon = adminMacaroon;
        this.lnSeed = lnSeed;
        this.lnPassword = lnPassword;
    }
}
