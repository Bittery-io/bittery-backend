import { LndStaticChannelBackupType } from './lnd-static-channel-backup-type';
import { LndStaticChannelBackupStatus } from './lnd-static-channel-backup-status';

export class LndStaticChannelBackup {
    id: string;
    lndId: string;
    creationDate: string;
    type: LndStaticChannelBackupType;
    status: LndStaticChannelBackupStatus;
    staticChannelBackupJsonBase64?: string;
    message?: string;

    constructor(id: string, lndId: string, creationDate: string, type: LndStaticChannelBackupType,
                status: LndStaticChannelBackupStatus, staticChannelBackupJsonBase64?: string, message?: string) {
        this.id = id;
        this.lndId = lndId;
        this.creationDate = creationDate;
        this.staticChannelBackupJsonBase64 = staticChannelBackupJsonBase64;
        this.type = type;
        this.status = status;
        this.message = message;
    }
}
