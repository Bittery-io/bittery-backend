import { getProperty } from './property-service';
import { lndGetInfo } from '../domain/services/lnd/api/lnd-api-service';

const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

export const getLndUri = async (macaroonHex: string, lndRestAddress: string): Promise<string | undefined> => {
    const info :any | undefined = await lndGetInfo(lndRestAddress, macaroonHex);
    return info ? info.uris[0] : undefined;
};

export const getTls = async (tlsCertName: string): Promise<string> => {
    return (await readFile(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/${tlsCertName}`)).toString();
};
