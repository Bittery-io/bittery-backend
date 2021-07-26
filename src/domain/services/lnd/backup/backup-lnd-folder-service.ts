import { logError, logInfo } from '../../../../application/logging-service';
import { connectSshToNode } from '../provisioning/lnd-droplet-digital-ocean-provision-service';
import { DigitalOceanLndForRestart } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';
import { downloadLndBackupFromDroplet, executeBackupInDroplet } from './digital-ocean-lnd-backup-service';
import { findDigitalOceanLndForRestart } from '../../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';

// returns full name of backup e.g backup.tar.gz
export const backupLndFolderAndGetFileName = async (lndId: string, userEmail: string): Promise<string> => {
    try {
        const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined = await findDigitalOceanLndForRestart(lndId, userEmail);
        if (digitalOceanLndForRestart) {
            logInfo(`[LND FOLDER BACKUP] 1/3 Started for LND with id ${lndId} and user email ${userEmail}`);
            const backupFileName: string  = `lnd_backup_${new Date().getTime()}`;
            const ssh: any = await connectSshToNode(userEmail, digitalOceanLndForRestart.dropletIp, digitalOceanLndForRestart.dropletId);
            await executeBackupInDroplet(ssh, backupFileName);
            logInfo(`[LND FOLDER BACKUP] 2/3 LND backup executed for LND with id ${lndId} and user email ${userEmail} in droplet with id ${digitalOceanLndForRestart.dropletId} and IP ${digitalOceanLndForRestart.dropletIp}`);
            await downloadLndBackupFromDroplet(ssh, String(digitalOceanLndForRestart.dropletId), backupFileName);
            const backupFileNameWithExtension: string = `${backupFileName}.tar.gz`;
            logInfo(`[LND FOLDER BACKUP] 3/3 LND backup downloaded for LND with id ${lndId} and user email ${userEmail} from droplet with id ${digitalOceanLndForRestart.dropletId} and IP ${digitalOceanLndForRestart.dropletIp}. Saved as ${backupFileNameWithExtension}.`);
            return backupFileNameWithExtension;
        } else {
            throw Error(`Cannot execute backup for LND with id ${lndId} for user ${userEmail} because such LND was not found!`);
        }
    } catch (err) {
        logError(err);
        throw new Error(`Backup LND failed for lndId ${lndId} and user email ${userEmail}. Error: ${err.message}`);
    }
};
