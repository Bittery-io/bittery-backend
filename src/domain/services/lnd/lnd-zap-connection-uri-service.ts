import { getMacaroonHex, getTls } from '../../../application/lnd-connect-service';

const lndconnect = require('lndconnect');

export const getLndConnectUri = async (lndAddress: string, tlsCert: string, macaroonHex: string): Promise<string> => {
    const grpsAddress: string = `${lndAddress}:10009`;
    return lndconnect.encode({
        host: grpsAddress,
        cert: tlsCert,
        macaroon: macaroonHex,
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
