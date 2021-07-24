import { logInfo } from '../../../../application/logging-service';
import { connectSshToNode } from '../provisioning/lnd-droplet-digital-ocean-provision-service';
import { DigitalOceanLndForRestart } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';
import { downloadLndBackupFromDroplet, executeBackupInDroplet } from './digital-ocean-lnd-backup-service';
import { findDigitalOceanLndForRestart } from '../../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';

export const backupLndFolderAndGetFileName = async (lndId: string, userEmail: string): Promise<string> => {
    const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined = await findDigitalOceanLndForRestart(lndId, userEmail);
    if (digitalOceanLndForRestart) {
        const backupFileName: string  = `lnd_backup_${new Date().getTime()}`;
        const ssh: any = await connectSshToNode(userEmail, digitalOceanLndForRestart.dropletIp, digitalOceanLndForRestart.dropletId);
        await executeBackupInDroplet(ssh, backupFileName);
        logInfo(`LND backup executed in droplet with id ${digitalOceanLndForRestart.dropletId} and IP ${digitalOceanLndForRestart.dropletIp}`);
        await downloadLndBackupFromDroplet(ssh, String(digitalOceanLndForRestart.dropletId), backupFileName);
        logInfo(`LND backup downloaded for droplet with id ${digitalOceanLndForRestart.dropletId} and IP ${digitalOceanLndForRestart.dropletIp}. Saved as ${backupFileName}.tar.gz.`);
        return backupFileName;
    } else {
        const message: string = `Cannot execute backup for LND with id ${lndId} for user ${userEmail} because such LND was not found!`;
        throw Error(message);
    }
};
