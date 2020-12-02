import axios from 'axios';
import { logError, logInfo } from '../../../../application/logging-service';
import path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { HostedLndType } from '../../../model/lnd/hosted/hosted-lnd-type';
import { sleep } from '../../utils/sleep-service';

const DIGITAL_OCEAN_TOKEN: string = 'd73fbdd7581ca76295539e499aabf8a7d6128ba0695898b5216502d2fb84fa96';
const readFile = util.promisify(fs.readFile);
// https://api.digitalocean.com/v2/actions/1077336652
// 218789153
// 219071689 - wujeki
// d28623be-506a-46bc-881d-a7ad0f96efbb

const { NodeSSH } = require('node-ssh');
const writeFile = util.promisify(fs.writeFile);
import { getProperty } from '../../../../application/property-service';
import { getMd5 } from '../../utils/checksum-service';
import { DropletCreationInfo } from '../../../model/lnd/hosted/digital_ocean/droplet-creation-info';
import { generateUuid } from '../../utils/id-generator-service';

const LOCAL_SSH_PRIVATE_KEY_PATH = getProperty('SSH_PRIV_KEY_PATH');
const LND_HOSTED_FILE_FOLDER_PATH = getProperty('LND_HOSTED_FILE_FOLDER_PATH');

export const createLndDroplet = async (userEmail: string, hostedLndType: HostedLndType):
        Promise<DropletCreationInfo> => {
    try {
        logInfo(`1/7 Started create LND droplet for user email ${userEmail} type ${hostedLndType}`);
        const digitalOceanInitScript: string = (await readFile(path.resolve(__dirname, '../../../../assets/digital-ocean-init-script.sh')))
            .toString('utf-8');
        const dropletName: string = getMd5(userEmail);
        const res = await axios.post('https://api.digitalocean.com/v2/droplets',
            {
                name: `${dropletName}5`,
                region: 'ams3',
                size: 's-1vcpu-1gb',
                image: 'docker-20-04',
                ssh_keys: ['b3:07:08:50:59:05:16:13:cd:98:69:b5:91:11:fc:24'],
                backups: false,
                ipv6: true,
                user_data: digitalOceanInitScript,
                private_networking: null,
                volumes: null,
                tags: ['lnd'],
            },
            {
                headers: {
                    Authorization: `Bearer ${DIGITAL_OCEAN_TOKEN}`,
                },
            });
        const dropletId: number = res.data.droplet.id;
        logInfo(`2/7 Successfully created droplet with id ${dropletId}, name ${dropletName} for user email ${userEmail}`);
        let dropletIpPublic: string = '';
        for (let i = 0; i < 20; i++) {
            const getDropletRes = await axios.get(`https://api.digitalocean.com/v2/droplets/${dropletId}`,
                {
                    headers: {
                        Authorization: `Bearer ${DIGITAL_OCEAN_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                });
            if (getDropletRes.data.droplet.networks.v4.length > 0) {
                dropletIpPublic = getDropletRes.data.droplet.networks.v4
                    .filter((network: any) => network.type === 'public')[0].ip_address;
                break;
            } else {
                logInfo(`2.5/7 Requested public IP for droplet with id ${dropletId} for user email ${userEmail}
                        but have no valid response yet. Sleeping for a while.`);
                await sleep(2000);
            }
        }
        if (dropletIpPublic === '') {
            throw new Error(`It should not happen but could not get droplet public IP address
                             for doplet with name ${dropletName} and droplet id ${dropletId}`);
        }
        logInfo(`3/7 Successfully obtained public IP ${dropletIpPublic} for droplet with id ${dropletId} for user email ${userEmail}`);
        const ssh = new NodeSSH();
        for (let i = 0; i < 20; i++) {
            try {
                await ssh.connect({
                    host: dropletIpPublic,
                    username: 'root',
                    privateKey: LOCAL_SSH_PRIVATE_KEY_PATH,
                });
                break;
            } catch (err) {
                logInfo(`3.5/7 Connecting SSH to droplet with id ${dropletId} for user email ${userEmail} not yet succeed. Sleeping for a while`);
                await sleep(5000);
            }
        }
        logInfo(`4/7 Connecting SSH to droplet with id ${dropletId} for user email ${userEmail} succeed`);
        if (hostedLndType === HostedLndType.STANDARD) {
            await ssh.putDirectory(path.resolve(__dirname, '../../../../assets/with-rtl'), '/root');
        } else {
            await ssh.putDirectory(path.resolve(__dirname, '../../../../assets/without-rtl'), '/root');
        }
        logInfo(`5/7 Successfully put LND directory for droplet with id ${dropletId} for user email ${userEmail}`);
        const rtlOneTimePassword: string = generateUuid();
        logInfo(`Rtl one time password: ${rtlOneTimePassword}`);
        const execRes = await ssh.execCommand(`sh /root/start.sh ${getProperty('BITCOIND_RPC_HOST')} ${getProperty('BITCOIND_RPC_USER')} ${getProperty('BITCOIND_RPC_PASSWORD')} ${getProperty('LND_HOSTED_VERSION')} ${getProperty('RTL_HOSTED_VERSION')} ${rtlOneTimePassword}`);
        // if (execRes.stderr) {
        //     throw new Error(`6/7 Starting LND for droplet with id ${dropletId} for user email ${userEmail} failed with err: ${execRes.stderr}`);
        // }
        logInfo(`6/7 Starting LND for droplet with id ${dropletId} for user email ${userEmail} succeed`);
        await sleep(2000);
        const tlsCertName: string = `${dropletName}.tls.cert`;
        await ssh.getFile(`${LND_HOSTED_FILE_FOLDER_PATH}/${tlsCertName}`, '/root/volumes/lnd/tls.cert');
        logInfo(`7/7 Getting tls certificate for droplet with id ${dropletId} for user email ${userEmail} succeed`);
        return new DropletCreationInfo(
            dropletId,
            dropletName,
            dropletIpPublic,
            tlsCertName,
            getProperty('LND_HOSTED_VERSION'),
            getProperty('RTL_HOSTED_VERSION'),
            rtlOneTimePassword,
        );
    } catch (err) {
        logError(`Digital ocean provisioning for domain ${userEmail} failed!`, err.message);
        throw err;
    }
};
