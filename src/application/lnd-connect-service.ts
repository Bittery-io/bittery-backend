import * as https from 'https';

const fs = require('fs');
const util = require('util');
import axios from 'axios';
import { getProperty } from './property-service';

const readFile = util.promisify(fs.readFile);

export const getLndUrl = async (domain: string): Promise<string | undefined> => {
    try {
        const res = await axios.get(`https://${domain}:445/lnd-rest/btc/v1/getinfo`, {
            headers: {
                'Grpc-Metadata-macaroon': await getMacaroonHex(domain),
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
            timeout: 3000,
        });
        return res.data.uris[0];
    } catch (err) {
        console.log(`Get info of node for domain ${domain} failed!`, err.message);
        return undefined;
    }
};

export const getCustomLndUrl = async (macaroonHex: string, lndRestAddress: string, tlsCert: string): Promise<string | undefined> => {
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
        console.log(`Get info of custom node for address ${lndRestAddress} failed!`, err.message);
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
        console.log(`Get info of custom node for address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }

};

export const getMacaroonHex = async (domain: string): Promise<string> => {
    return (await readFile(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/volumes/lnd/${domain}/bitcoin/datadir/admin.macaroon`)).toString('hex');
};

export const getMacaroon = async (domain: string): Promise<string> => {
    return (await readFile(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/volumes/lnd/${domain}/bitcoin/datadir/admin.macaroon`)).toString();
};

export const getTls = async (domain: string): Promise<string> => {
    return (await readFile(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/volumes/lnd/${domain}/bitcoin/datadir/tls.cert`)).toString();
};
