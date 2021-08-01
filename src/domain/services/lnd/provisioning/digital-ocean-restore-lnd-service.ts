import { connectSshToNode } from './lnd-droplet-digital-ocean-provision-service';
import { getProperty } from '../../../../application/property-service';
import { logError, logInfo } from '../../../../application/logging-service';

export const restoreLndInDroplet = async (
        userEmail: string, dropletIp: string, dropletId: number, oldDropletId: number, backupFileNameWithExtension: string): Promise<boolean> => {
    try {
        const ssh: any = await connectSshToNode(userEmail, dropletIp, dropletId);
        await executePrepareForRestoreLndInDroplet(ssh);
        // just for restarting all setup, not need of backup
        await uploadOldLndFolderToDroplet(ssh, oldDropletId, backupFileNameWithExtension);
        await executeRestoreLndInDroplet(ssh, backupFileNameWithExtension, dropletIp);
        logInfo('Restore process done');
        return true;
    } catch (err) {
        logError('Restore LND in droplet failed with err.', err);
        throw false;
    }
};

export const executePrepareForRestoreLndInDroplet = async (ssh: any): Promise<void> => {
    await ssh.execCommand(`sh /root/prepare-for-restore-lnd.sh`);
};
export const executeRestoreLndInDroplet = async (ssh: any, backupFileNameWithExtension: string, newDropletIp: string): Promise<void> => {
    await ssh.execCommand(`sh /root/restore-lnd.sh ${backupFileNameWithExtension} ${newDropletIp}`);
};

const uploadOldLndFolderToDroplet = async (ssh: any, dropletId: number, backupFileNameWithExtension: string): Promise<void> => {
    await ssh.putFile(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/backups/droplet_${dropletId}/${backupFileNameWithExtension}`, `/root/${backupFileNameWithExtension}`);
};
