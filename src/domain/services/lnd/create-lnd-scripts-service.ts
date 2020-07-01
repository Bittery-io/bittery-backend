import { getProperty } from '../../../application/property-service';
import { runAsSudo } from '../../../application/sudo-service';

const { exec } = require('child_process');

export const createUserLndNode = async (domainName: string, lndPort: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(`Starting adding LND services for domain ${domainName} and lnd port ${lndPort}`);
            exec(`../bitter-payer-infrastructure/add-user.sh ${domainName} ${lndPort}`, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.log(`Error adding LND services for domain ${domainName} and lnd port ${lndPort}: ${error.message}`);
                    reject('Failed adding user LND services');
                    return;
                }
                if (stderr) {
                    console.log(`Stderr (error) adding LND services for domain ${domainName} and lnd port ${lndPort}: ${stderr}`);
                    reject('Failed adding user LND services');
                    return;
                }
                console.log(`Successfully added LND services for domain ${domainName}. Proceeding with starting.`);
                // @ts-ignore
                exec(`../bitter-payer-infrastructure/start-user-services.sh ${domainName}`, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`Error starting LND services for domain ${domainName}: ${error.message}`);
                        reject('Failed starting user LND services');
                        return;
                    }
                    if (stderr) {
                        console.log(`Stderr (error) starting LND services for domain ${domainName}: ${stderr}`);
                        reject('Failed starting user LND services');
                        return;
                    }
                    console.log(`Successfully started LND services for domain: ${domainName}. Stdout: ${stdout}`);
                    // tslint:disable-next-line:max-line-length
                    runAsSudo(['chmod', '0777', `${getProperty('BITTER_PAYER_INFRASTRUCTURE_PATH')}/volumes/lnd/${domainName}/bitcoin/datadir/admin.macaroon`], () => {
                        console.log('Finished chmod on admin.macaroon');
                        runAsSudo(['chmod', '0777', `${getProperty('BITTER_PAYER_INFRASTRUCTURE_PATH')}/volumes/lnd/${domainName}/bitcoin/datadir/tls.certificate`], () => {
                            console.log('Finished chmod on tls.certificate');
                            resolve();
                        });
                    });
                });
            });
        }, 100);
    });
};
