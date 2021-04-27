export class AllStaticChannelsBackupDto {
    scb: string;
    creationDate: string;

    constructor(scb: string, creationDate: string) {
        this.scb = scb;
        this.creationDate = creationDate;
    }
}
