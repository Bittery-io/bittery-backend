import * as util from 'util';

const { exec } = require('child_process');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);

export const getCertThumbprint = async (tlsCert: string): Promise<string> => {
    const tlsCertFilePath: string = `${process.env.BITTER_PAYER_INFRASTRUCTURE_PATH}/custom-lnd-certs/tls.cert`;
    await writeFile(tlsCertFilePath, Buffer.from(tlsCert, 'utf8'));
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            exec(`openssl x509 -noout -fingerprint -sha256 -inform pem -in ${tlsCertFilePath} | sed -e 's/.*=//' -e 's/://g'`,
                (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        console.log('Error processing user tls.cert', error);
                        reject('Error processing user tls.cert');
                    }
                    if (stderr) {
                        console.log('Stderr error processing user tls.cert', stderr);
                        reject('Stderr error processing user tls.cert');
                    }
                    resolve(stdout);
                });
        }, 100);
    });
};
