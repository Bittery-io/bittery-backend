import { LndStaticChannelBackupType } from './lnd-static-channel-backup-type';
import { LndStaticChannelBackupStatus } from './lnd-static-channel-backup-status';

export class LndStaticChannelBackupClientReadView {
    id: string;
    creationDate: string;
    type: LndStaticChannelBackupType;
    status: LndStaticChannelBackupStatus;

    constructor(id: string, creationDate: string,
                type: LndStaticChannelBackupType,
                status: LndStaticChannelBackupStatus) {
        this.id = id;
        this.creationDate = creationDate;
        this.type = type;
        this.status = status;
    }
}
