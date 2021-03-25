import { getProperty } from './property-service';
import { lndGetInfo } from '../domain/services/lnd/api/lnd-api-service';
import { LndInfo } from '../domain/model/lnd/api/lnd-info';

const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

export const getLndUri = async (macaroonHex: string, lndRestAddress: string, lndIpAddress: string): Promise<string | undefined> => {
    const info: LndInfo | undefined = await lndGetInfo(lndRestAddress, macaroonHex);
    return info ?  formatLndUri(info.publicKey, lndIpAddress) : undefined;
};

export const formatLndUri = (publicKey: string, lndIpAddress: string): string => {
    return `${publicKey}@${lndIpAddress}:9735`;
};

export const getTls = async (tlsCertName: string): Promise<string> => {
    return (await readFile(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/${tlsCertName}`)).toString();
};
