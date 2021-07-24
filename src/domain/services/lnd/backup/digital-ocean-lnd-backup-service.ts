import { getProperty } from '../../../../application/property-service';
const fs = require('fs');

export const executeBackupInDroplet = async (ssh: any, backupName: string): Promise<void> => {
    await ssh.execCommand(`sh /root/create-lnd-backup.sh ${backupName}`);
};

export const downloadLndBackupFromDroplet = async (ssh: any, dropletId: string, backupName: string): Promise<void> => {
    const backupFileName: string = `${backupName}.tar.gz`;
    fs.promises.mkdir(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/backups/droplet_${dropletId}`, { recursive: true }).catch(console.error);
    await ssh.getFile(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/backups/droplet_${dropletId}/${backupFileName}`, `/root/backups/${backupFileName}`);
};
