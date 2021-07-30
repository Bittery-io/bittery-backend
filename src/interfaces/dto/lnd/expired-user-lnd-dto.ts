export class ExpiredUserLndDto {
    lndId: string;
    publicKey: string;
    creationDate: string;
    expirationDate: string;

    constructor(lndId: string, publicKey: string, creationDate: string, expirationDate: string) {
        this.lndId = lndId;
        this.publicKey = publicKey;
        this.creationDate = creationDate;
        this.expirationDate = expirationDate;
    }
}
