import * as util from 'util';
import { getProperty } from './property-service';
import { logError } from './logging-service';

const { exec } = require('child_process');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);

export const getCertThumbprint = async (userEmail: string, tlsCert: string): Promise<string> => {
    const userTlsCertFilePath: string = `${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/custom-lnd-certs/${userEmail}-tls.cert`;
    await writeFile(userTlsCertFilePath, Buffer.from(tlsCert, 'utf8'));
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            exec(`openssl x509 -noout -fingerprint -sha256 -inform pem -in ${userTlsCertFilePath} | sed -e 's/.*=//' -e 's/://g'`,
                (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        logError('Error processing user tls.cert', error);
                        reject('Error processing user tls.cert');
                    }
                    if (stderr) {
                        logError('Stderr error processing user tls.cert', stderr);
                        reject('Stderr error processing user tls.cert');
                    }
                    resolve(stdout);
                });
        }, 100);
    });
};
