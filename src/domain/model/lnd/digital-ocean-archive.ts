export class DigitalOceanArchive {
    lndId: string;
    archiveDate: string;
    backupName: string;

    constructor(lndId: string, archiveDate: string, backupName: string) {
        this.lndId = lndId;
        this.archiveDate = archiveDate;
        this.backupName = backupName;
    }
}
