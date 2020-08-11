const isPortReachable = require('is-port-reachable');

export const isPortFreeToUse = async (port: number): Promise<boolean> => {
    // if it's reachable it means it's busy
    return !await isPortReachable(port, { host: 'localhost' });
};
