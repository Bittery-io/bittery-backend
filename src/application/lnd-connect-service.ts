import * as https from 'https';

const fs = require('fs');
const util = require('util');
import axios from 'axios';
import { getProperty } from './property-service';
import { logError } from './logging-service';

const readFile = util.promisify(fs.readFile);

export const getLndUrl = async (macaroonHex: string, lndRestAddress: string, tlsCert: string): Promise<string | undefined> => {
    try {
        const res = await axios.get(`${lndRestAddress}/v1/getinfo`, {
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex,
            },
            httpsAgent: new https.Agent({
                ca: [tlsCert],
            }),
            timeout: 6000,
        });
        return res.data.uris[0];
    } catch (err) {
        logError(`Get info of custom node for address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }
};

export const getLndInfo = async (macaroonHex: string, lndRestAddress: string, tlsCert: string): Promise<any | undefined> => {
    try {
        const res = await axios.get(`${lndRestAddress}/v1/getinfo`, {
            headers: {
                'Grpc-Metadata-macaroon': macaroonHex,
            },
            httpsAgent: new https.Agent({
                ca: [tlsCert],
            }),
        });
        return res.data;
    } catch (err) {
        logError(`Get info of custom node for address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }

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
