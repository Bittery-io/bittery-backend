import { getProperty } from './property-service';
import { logError } from './logging-service';
import * as util from 'util';

const { exec } = require('child_process');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);

export const getCertThumbprint = async (tlsCertName: string): Promise<string> => {
    const userTlsCertFilePath: string = `${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/${tlsCertName}`;
    return generateSslThumbprint(userTlsCertFilePath);
};

export const getCertThumbprintForExternalLnd = async (userEmail: string, tlsCert: string): Promise<string> => {
    fs.promises.mkdir(`${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/external-lnd-certs`, { recursive: true }).catch(console.error);
    const userTlsCertFilePath: string = `${getProperty('LND_HOSTED_FILE_FOLDER_PATH')}/external-lnd-certs/external-${userEmail}-tls.cert`;
    await writeFile(userTlsCertFilePath, Buffer.from(tlsCert, 'utf8'));
    return generateSslThumbprint(userTlsCertFilePath);
};

const generateSslThumbprint = (tlsCertFullPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            exec(`openssl x509 -noout -fingerprint -sha256 -inform pem -in ${tlsCertFullPath} | sed -e 's/.*=//' -e 's/://g'`,
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
