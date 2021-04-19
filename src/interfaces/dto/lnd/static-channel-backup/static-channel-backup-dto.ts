import { SingleStaticChannelBackupDto } from './single-static-channel-backup-dto';

export class StaticChannelBackupDto {

    scbs: SingleStaticChannelBackupDto[];
    millisecondsToNextBackup: number;

    constructor(scbs: SingleStaticChannelBackupDto[], millisecondsToNextBackup: number) {
        this.scbs = scbs;
        this.millisecondsToNextBackup = millisecondsToNextBackup;
    }
}
