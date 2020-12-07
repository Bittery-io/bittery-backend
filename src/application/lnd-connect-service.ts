import { getProperty } from './property-service';
import { lndGetInfo } from '../domain/services/lnd/api/lnd-api-service';

const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

export const getLndUrl = async (macaroonHex: string, lndRestAddress: string): Promise<string | undefined> => {
    const info :any | undefined = await lndGetInfo(lndRestAddress, macaroonHex);
    return info ? info.uris[0] : undefined;
};

export const getMacaroonHex = async (domain: string): Promise<string> => {
    return (await readFile(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/volumes/lnd/${domain}/bitcoin/datadir/admin.macaroon`)).toString('hex');
};

export const getMacaroonBase64 = async (domain: string): Promise<string> => {
    return (await readFile(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/volumes/lnd/${domain}/bitcoin/datadir/admin.macaroon`)).toString('base64');
};

export const getTls = async (tlsCertName: string): Promise<string> => {
    return (await readFile(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/${tlsCertName}`)).toString();
};

export const getTlsBase64 = async (tlsCertName: string): Promise<string> => {
    return (await readFile(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/${tlsCertName}`)).toString('base64');
};
