import axios from 'axios';
import { logInfo } from '../../../../application/logging-service';
import path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { HostedLndType } from '../../../model/lnd/hosted/hosted-lnd-type';
import { sleep } from '../../utils/sleep-service';
import { getProperty } from '../../../../application/property-service';
import { DropletCreationInfo } from '../../../model/lnd/hosted/digital_ocean/droplet-creation-info';
import { generateUuid } from '../../utils/id-generator-service';
import { CreateDigitalOceanLndFailedException } from '../../../model/lnd/hosted/digital_ocean/create-digital-ocean-lnd-failed-exception';
import { DigitalOceanLndDeploymentStageType } from '../../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-deployment-stage-type';

export const DIGITAL_OCEAN_TOKEN: string = getProperty('DIGITAL_OCEAN_TOKEN');
const readFile = util.promisify(fs.readFile);

const { NodeSSH } = require('node-ssh');

const SSH_PRIV_KEY_PATH: string = getProperty('SSH_PRIV_KEY_PATH');
const LND_HOSTED_FILE_FOLDER_PATH: string = getProperty('LND_HOSTED_FILE_FOLDER_PATH');
const DIGITAL_OCEAN_SSH_KEY_NAME = getProperty('DIGITAL_OCEAN_SSH_KEY_NAME');

export const createLndDroplet = async (
        dropletName: string,
        userEmail: string,
        hostedLndType: HostedLndType,
        wumboChannels: boolean,
        lnAlias?: string,
        lndHostedVersion?: string,
        rtlHostedVersion?: string,
        rtlOneTimePassword?: string): Promise<DropletCreationInfo> => {
    logInfo(`1/7 Started create LND droplet for user email ${userEmail} type ${hostedLndType}`);
    let dropletId: number;
    const lndHostedVersionToUse: string = lndHostedVersion ? lndHostedVersion : getProperty('LND_HOSTED_VERSION');
    const rtlHostedVersionToUse: string = rtlHostedVersion ? rtlHostedVersion : getProperty('RTL_HOSTED_VERSION');
    const rtlOneTimePasswordToUse: string = rtlOneTimePassword ? rtlOneTimePassword : generateUuid();
    try {
        dropletId = await createDropletAndGetDropletId(userEmail, dropletName);
        logInfo(`2/7 Successfully created droplet with id ${dropletId}, name ${dropletName} for user email ${userEmail}`);
    } catch (err) {
        throw new CreateDigitalOceanLndFailedException(DigitalOceanLndDeploymentStageType.DROPLET_CREATION,
            dropletName, err.message);
    }

    let dropletIpPublic: string;
    try {
        dropletIpPublic = await getDropletPublicIp(userEmail, dropletId, dropletName);
        logInfo(`3/7 Successfully obtained public IP ${dropletIpPublic} for droplet with id ${dropletId} for user email ${userEmail}`);
    } catch (err) {
        throw new CreateDigitalOceanLndFailedException(DigitalOceanLndDeploymentStageType.DROPLET_IP_OBTAIN, dropletName,
            err.message, dropletId);
    }

    let ssh: any;
    try {
        ssh = await connectSshToNode(userEmail, dropletIpPublic, dropletId);
        logInfo(`4/7 Successfully SSH connected to droplet with id ${dropletId} for user email ${userEmail}`);
    } catch (err) {
        throw new CreateDigitalOceanLndFailedException(DigitalOceanLndDeploymentStageType.SSH_CONNECTION,
            dropletName, err.message, dropletId, dropletIpPublic);
    }

    try {
        await putLndFilesToDroplet(ssh, hostedLndType);
        logInfo(`5/7 Successfully put LND directory for droplet with id ${dropletId} for user email ${userEmail}`);
    } catch (err) {
        throw new CreateDigitalOceanLndFailedException(DigitalOceanLndDeploymentStageType.PUT_LND_FILES,
            dropletName, err.message, dropletId, dropletIpPublic);
    }

    try {
        await startLndInDroplet(
            ssh,
            dropletIpPublic,
            wumboChannels,
            getProperty('BITCOIND_RPC_HOST_FROM_INTERNET'),
            getProperty('BITCOIND_RPC_USER'),
            getProperty('BITCOIND_RPC_PASSWORD'),
            lndHostedVersionToUse,
            rtlHostedVersionToUse,
            rtlOneTimePasswordToUse,
            lnAlias);
        logInfo(`6/7 Successfully started LND for droplet with id ${dropletId} for user email ${userEmail}`);
    } catch (err) {
        throw new CreateDigitalOceanLndFailedException(DigitalOceanLndDeploymentStageType.START_LND,
            dropletName, err.message, dropletId, dropletIpPublic, rtlOneTimePasswordToUse);
    }

    let tlsCertName: string;
    try {
        tlsCertName = await downloadTlsCertFromLndOnDropletAndGetTlsCertName(ssh, dropletName);
        logInfo(`7/7 Successfully downloaded TLS certificate for droplet with id ${dropletId} for user email ${userEmail}`);
    } catch (err) {
        throw new CreateDigitalOceanLndFailedException(DigitalOceanLndDeploymentStageType.DOWNLOAD_TLS_CERT,
            dropletName, err.message, dropletId, dropletIpPublic, rtlOneTimePasswordToUse);
    }
    return new DropletCreationInfo(
        dropletId,
        dropletName,
        dropletIpPublic,
        tlsCertName,
        lndHostedVersionToUse,
        rtlHostedVersionToUse,
        rtlOneTimePasswordToUse,
    );
};

const createDropletAndGetDropletId = async (userEmail: string, dropletName: string): Promise<number> => {
    const digitalOceanInitScript: string = (await readFile(path.resolve(__dirname, '../../../../assets/digital-ocean-init-script.sh')))
        .toString('utf-8');
    const res = await axios.post('https://api.digitalocean.com/v2/droplets',
        {
            name: `${dropletName}`,
            region: 'ams3',
            size: 's-1vcpu-1gb',
            image: 'docker-20-04',
            ssh_keys: [DIGITAL_OCEAN_SSH_KEY_NAME],
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
    return res.data.droplet.id;
};

const getDropletPublicIp = async (userEmail: string, dropletId: number, dropletName: string): Promise<string> => {
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
            await sleep(3000);
        }
    }
    if (dropletIpPublic !== '') {
        return dropletIpPublic;
    } else {
        throw new Error(`It should not happen but could not get droplet public IP address
                         for doplet with name ${dropletName} and droplet id ${dropletId}`);
    }
};

export const connectSshToNode = async (userEmail: string, dropletIpPublic: string, dropletId?: number): Promise<any> => {
    const ssh = new NodeSSH();
    for (let i = 0; i < 20; i++) {
        try {
            await ssh.connect({
                host: dropletIpPublic,
                username: 'root',
                privateKey: SSH_PRIV_KEY_PATH,
            });
            break;
        } catch (err) {
            if (dropletId) {
                logInfo(`3.5/7 Connecting SSH to droplet with id ${dropletId} for user email ${userEmail} not yet succeed. Sleeping for a while`);
                await sleep(5000);
            } else {
                logInfo(`Connecting SSH to user email ${userEmail} droplet with IP ${dropletIpPublic}.`);
            }
        }
    }
    return ssh;
};

const putLndFilesToDroplet = async (ssh: any, hostedLndType: HostedLndType): Promise<void> => {
    if (hostedLndType === HostedLndType.STANDARD) {
        await ssh.putDirectory(path.resolve(__dirname, '../../../../assets/with-rtl'), '/root');
    } else {
        await ssh.putDirectory(path.resolve(__dirname, '../../../../assets/without-rtl'), '/root');
    }
};

const downloadTlsCertFromLndOnDropletAndGetTlsCertName = async (ssh: any, dropletName: string): Promise<string> => {
    await sleep(2000);
    const tlsCertName: string = `${dropletName}.tls.cert`;
    await ssh.getFile(`${LND_HOSTED_FILE_FOLDER_PATH}/${tlsCertName}`, '/root/volumes/lnd/tls.cert');
    return tlsCertName;
};

export const startLndInDroplet = async (
        ssh: any,
        dropletPublicIp: string,
        wumboChannels: boolean,
        bitcoinRpcHost: string,
        bitcoinRpcUser: string,
        bitcoinRpcPassword: string,
        lndHostedVersion: string,
        rtlHostedVersion: string,
        // password is used only for first start.sh
        rtlOneTimePassword?: string,
        lnAlias?: string): Promise<void> => {
    const wumboChannelsString: string = wumboChannels ? 'true' : 'false';
    const lnAliasString: string = lnAlias ? lnAlias : 'NO_LN_ALIAS';
    const command: string = `bash /root/start.sh ${bitcoinRpcHost} ${bitcoinRpcUser} \"${bitcoinRpcPassword}\" ${lndHostedVersion} ${rtlHostedVersion} ${dropletPublicIp} \"${lnAliasString}\" ${wumboChannelsString} ${rtlOneTimePassword}`;
    logInfo(`Start command: ${command}`);
    const res = await ssh.execCommand(command);
    console.log('exec res: ', res);
};
