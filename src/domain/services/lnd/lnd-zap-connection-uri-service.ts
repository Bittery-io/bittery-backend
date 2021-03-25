const lndconnect = require('lndconnect');

export const getLndConnectUri = async (lndAddress: string, tlsCert: string, macaroonHex: string): Promise<string> => {
    const grpcAddress: string = `${lndAddress}:10009`;
    return lndconnect.encode({
        host: grpcAddress,
        cert: tlsCert,
        macaroon: macaroonHex,
    });
};
