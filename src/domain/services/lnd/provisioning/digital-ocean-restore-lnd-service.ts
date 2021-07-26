import { connectSshToNode } from './lnd-droplet-digital-ocean-provision-service';
import { getProperty } from '../../../../application/property-service';
import { logInfo } from '../../../../application/logging-service';

export const restoreLndInDroplet = async (
        userEmail: string, dropletIp: string, dropletId: number, oldDropletId: number, backupFileName: string) => {
    const ssh: any = await connectSshToNode(userEmail, dropletIp, dropletId);
    await executePrepareForRestoreLndInDroplet(ssh);
    // just for restarting all setup, not need of backup
    await uploadOldLndFolderToDroplet(ssh, oldDropletId, backupFileName);
    await executeRestoreLndInDroplet(ssh, backupFileName, dropletIp);
    logInfo('Restore process done');
};

export const executePrepareForRestoreLndInDroplet = async (ssh: any): Promise<void> => {
    await ssh.execCommand(`sh /root/prepare-for-restore-lnd.sh`);
};
export const executeRestoreLndInDroplet = async (ssh: any, backupFileName: string, newDropletIp: string): Promise<void> => {
    await ssh.execCommand(`sh /root/restore-lnd.sh ${backupFileName}.tar.gz ${newDropletIp}`);
};

const uploadOldLndFolderToDroplet = async (ssh: any, dropletId: number, backupFileName: string): Promise<void> => {
    const fileName: string = `${backupFileName}.tar.gz`;
    await ssh.putFile(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/backups/droplet_${dropletId}/${fileName}`, `/root/${fileName}`);
};
