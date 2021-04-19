import { LndStaticChannelBackupType } from '../../../../domain/model/lnd/static-channel-backup/lnd-static-channel-backup-type';
import { LndStaticChannelBackupStatus } from '../../../../domain/model/lnd/static-channel-backup/lnd-static-channel-backup-status';

export class SingleStaticChannelBackupDto {

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
