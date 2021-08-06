import { connectSshToNode } from './provisioning/lnd-droplet-digital-ocean-provision-service';
import { getProperty } from '../../../application/property-service';
import * as util from 'util';
import * as fs from 'fs';

const readFile = util.promisify(fs.readFile);
const removeFile = util.promisify(fs.unlink);

// export const readAdminMacaroonBase64FromLnd = async (userEmail: string, dropletIp: string): Promise<string> => {
//     const ssh: any = await connectSshToNode(userEmail, dropletIp);
//     const admianMacaroonTmpName: string = `${userEmail}.${dropletIp}.admin.macaroon`;
//     const filePath: string = `${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/${admianMacaroonTmpName}`;
//     await ssh.getFile(filePath, '/lnd/data/chain/bitcoin/testnet');
//     const base64AdminMacaroon: string = (await readFile(filePath)).toString('base64');
//     await removeFile(filePath);
//     return base64AdminMacaroon;
// };
