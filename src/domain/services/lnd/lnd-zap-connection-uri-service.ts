import { getMacaroonHex, getTls } from '../../../application/lnd-connect-service';

const lndconnect = require('lndconnect');

export const getLndConnectUri = async (domainName: string): Promise<string> => {
    const grpsAddress: string = `${domainName}:443`;
    return lndconnect.encode({
        host: grpsAddress,
        cert: await getTls(domainName),
        macaroon: await getMacaroonHex(domainName),
    });
};

// with custom macaroon connection fails
// export const getCustomLndConnectUri = async (lndAddressRest: string, tlsCert: string, macaroonHex: string): Promise<string> => {
//     return lndconnect.encode({
//         host: 'emergencja:443',
//         cert: tlsCert,
//         macaroon: macaroonHex,
//     });
// };
