const lndconnect = require('lndconnect');

export const getLndConnectUri = async (lndAddress: string, tlsCert: string, macaroonHex: string): Promise<string> => {
    const grpsAddress: string = `${lndAddress}:10009`;
    return lndconnect.encode({
        host: grpsAddress,
        cert: tlsCert,
        macaroon: macaroonHex,
    });
};
