export class UserEncryptedArtefacts {
    userEmail: string;
    lndId: string;
    adminMacaroon?: string;
    lnSeed?: string;
    lnPassword?: string;
    standardWalletSeed?: string;

    constructor(userEmail: string, lndId: string, adminMacaroon?: string, lnSeed?: string, lnPassword?: string, standardWalletSeed?: string) {
        this.userEmail = userEmail;
        this.lndId = lndId;
        this.adminMacaroon = adminMacaroon;
        this.lnSeed = lnSeed;
        this.lnPassword = lnPassword;
        this.standardWalletSeed = standardWalletSeed;
    }
}
