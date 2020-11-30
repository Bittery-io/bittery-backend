import axios from 'axios';
import { logError, logInfo } from '../../../../application/logging-service';
import path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { LndType } from '../../../model/lnd/lnd-type';

const DIGITAL_OCEAN_TOKEN: string = 'd73fbdd7581ca76295539e499aabf8a7d6128ba0695898b5216502d2fb84fa96';
const readFile = util.promisify(fs.readFile);
// https://api.digitalocean.com/v2/actions/1077336652
// 218789153
// 219071689 - wujeki
// 72401866

const { NodeSSH } = require('node-ssh');
const writeFile = util.promisify(fs.writeFile);

export const createLndDroplet = async (userDomain: string, lndType: LndType) => {
    try {
        const logoSrc = (await readFile(path.resolve(__dirname, '../../../../assets/digital-ocean-init-script.sh')))
            .toString('utf-8');
        // const res = await axios.post('https://api.digitalocean.com/v2/droplets',
        //     {
        //         name: `${userDomain}2`,
        //         region: 'ams3',
        //         size: 's-1vcpu-1gb',
        //         image: 'docker-20-04',
        //         ssh_keys: ['b3:07:08:50:59:05:16:13:cd:98:69:b5:91:11:fc:24'],
        //         backups: false,
        //         ipv6: true,
        //         user_data: logoSrc,
        //         private_networking: null,
        //         volumes: null,
        //         tags: ['lnd'],
        //     },
        //     {
        //         headers: {
        //             Authorization: `Bearer ${DIGITAL_OCEAN_TOKEN}`,
        //         },
        //     });
        const res = await axios.get('https://api.digitalocean.com/v2/droplets/219071689',
            {
                headers: {
                    Authorization: `Bearer ${DIGITAL_OCEAN_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });
        logInfo('Digital ocean provision succeed!');
        const ssh = new NodeSSH();
        await ssh.connect({
            host: '128.199.48.179',
            username: 'root',
            privateKey: '/home/peer/.ssh/id_rsa',
        });

        // fs.mkdir(path.resolve(__dirname, `../../../../assets/${userDomain}`), { recursive: true }, (err) => {
        //     if (err) {
        //         throw err;
        //     }
        // });
        // let dockerComposeFileName: string;
        // if (lndType === LndType.STANDARD) {
        //     dockerComposeFileName = 'docker-compose.user.with.rtl.template.yaml';
        // } else {
        //     dockerComposeFileName = 'docker-compose.user.template.yaml';
        // }
        // const configFile: string = (await readFile(path.resolve(__dirname, `../../../../assets/${dockerComposeFileName}`)))
        //     .toString('utf-8');
        // const newConfigFileName: string = `../../../../assets/${userDomain}/${dockerComposeFileName}`;
        // await writeFile(path.resolve(__dirname, newConfigFileName), Buffer.from(configFile, 'utf8'));

        // let nginxConfigFile: string = (await readFile(path.resolve(__dirname, '../../../../assets/user.prod.nginx.template.conf')))
        //     .toString('utf-8');
        // nginxConfigFile = nginxConfigFile.replaceAll('$DOMAIN', userDomain);
        // const newNginxConfigFile: string = `../../../../assets/wujekpompa/user.prod.nginx.conf`;
        // await writeFile(path.resolve(__dirname, newNginxConfigFile), Buffer.from(nginxConfigFile, 'utf8'));
        if (lndType === LndType.STANDARD) {
            await ssh.putDirectory(path.resolve(__dirname, '../../../../assets/with-rtl'),
                '/root');
        } else {

        }
        const execRes = await ssh.execCommand('sh /root/start.sh');
        console.log('siemka');
    } catch (err) {
        logError(`Digital ocean provisioning for domain ${userDomain} failed!`, err.message);
        return undefined;
    }

};
