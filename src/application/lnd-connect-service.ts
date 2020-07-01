import * as https from 'https';

const fs = require('fs');
const util = require('util');
import axios from 'axios';

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
            timeout: 5000,
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
            timeout: 10000,
        });
        return res.data.uris[0];
    } catch (err) {
        console.log(`Get info of custom node for address ${lndRestAddress} failed!`, err.message);
        return undefined;
    }
};

export const getLndInfoStatus = async (macaroonHex: string, lndRestAddress: string, tlsCert: string): Promise<number> => {
    const res = await axios.get(`${lndRestAddress}/v1/getinfo`, {
        headers: {
            'Grpc-Metadata-macaroon': macaroonHex,
        },
        httpsAgent: new https.Agent({
            ca: [tlsCert],
        }),
    });
    return res.status;
};

export const getMacaroonHex = async (domain: string): Promise<string> => {
    return (await readFile(`${process.env.BITTER_PAYER_INFRASTRUCTURE_PATH}/volumes/lnd/${domain}/bitcoin/datadir/admin.macaroon`)).toString('hex');
};

export const getMacaroon = async (domain: string): Promise<string> => {
    return (await readFile(`${process.env.BITTER_PAYER_INFRASTRUCTURE_PATH}/volumes/lnd/${domain}/bitcoin/datadir/admin.macaroon`)).toString();
};

export const getTls = async (domain: string): Promise<string> => {
    return (await readFile(`${process.env.BITTER_PAYER_INFRASTRUCTURE_PATH}/volumes/lnd/${domain}/bitcoin/datadir/tls.cert`)).toString();
};
