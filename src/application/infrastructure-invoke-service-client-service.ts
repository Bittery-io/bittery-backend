import { getProperty } from './property-service';
const { exec } = require('child_process');
import axios from 'axios';

export const createUserLndNode = async (domainName: string, lndPort: string, rtlInitPassword: string): Promise<void> => {
    const invokeServerHost: string = await getInvokeServerHost();
    try {
        const res = await axios.post(`http://${invokeServerHost}:${getProperty('INVOKE_SERVER_PORT')}/add-user`, {
            domainName,
            lndPort,
            rtlInitPassword,
        }, {
            // timeout after minute
            timeout: 60000,
        });
        console.log('Creating user lnd node succeed with http response: ', res.status);
    } catch (err) {
        console.log('Creating user lnd node failed with error!', err.message);
        throw new Error(err.message);
    }
};

export const isPortFreeToUse = async (port: number): Promise<boolean> => {
    const invokeServerHost: string = await getInvokeServerHost();
    try {
        await axios.get(`http://${invokeServerHost}:${getProperty('INVOKE_SERVER_PORT')}/is-port-free/${port}`);
        console.log(`Got successful port ${port} free response from infrastructure service!`);
        return true;
    } catch (err) {
        console.log(`Got port ${port} busy response from infrastructure service!`);
        return false;
    }
};

const getInvokeServerHostInDocker = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            exec(`ip route show | awk '/default/ {print $3}'`,
                (error: any, stdout: any, stderr: any) => {
                    console.log('dostalem kurwa zwrotke: ', error, stdout, stderr);
                    if (error) {
                        console.log('Error getting host ip from docker container', error);
                        reject('Error getting host ip from docker container');
                    }
                    if (stderr) {
                        console.log('Stderr getting host ip from docker container', stderr);
                        reject('Stderr getting host ip from docker container');
                    }
                    const address: string = stdout.replace(/(\r\n|\n|\r)/gm, '');
                    resolve(address);
                });
        }, 10);
    });
};

const getInvokeServerHost = async (): Promise<string> => {
    const hostFromProperty: string = getProperty('INVOKE_SERVER_HOST');
    if (hostFromProperty !== undefined) {
        return hostFromProperty;
    } else {
        return await getInvokeServerHostInDocker();
    }
};
