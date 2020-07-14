import { getProperty } from '../../../application/property-service';

const { exec } = require('child_process');

export const createUserLndNode = async (domainName: string, lndPort: string, rtlInitPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(`Starting adding LND services for domain ${domainName} and lnd port ${lndPort}`);
            // tslint:disable-next-line:max-line-length
            exec(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/add-user.sh ${domainName} ${lndPort} ${rtlInitPassword}`, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.log(`1/3 Error adding LND services for domain ${domainName} and lnd port ${lndPort}: ${error.message}`);
                    reject('Failed adding user LND services');
                    return;
                }
                if (stderr) {
                    console.log(`1/3 Stderr (error) adding LND services for domain ${domainName} and lnd port ${lndPort}: ${stderr}`);
                    reject('Failed adding user LND services');
                    return;
                }
                console.log(`1/3 Successfully added LND services for domain ${domainName}. Proceeding with starting.`);
                // @ts-ignore
                exec(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/start-user-services.sh ${domainName}`, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`2/3 Error starting LND services for domain ${domainName}: ${error.message}`);
                        reject('Failed starting user LND services');
                        return;
                    }
                    if (stderr) {
                        console.log(`2/3 Stderr (error) starting LND services for domain ${domainName}: ${stderr}`);
                        reject('Failed starting user LND services');
                        return;
                    }
                    console.log(`2/3 Successfully started LND services for domain: ${domainName}. Stdout: ${stdout}`);
                    // @ts-ignore
                    exec(`sudo ${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/chmod-user-lnd-files.sh ${domainName}`, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`3/3 Error chmod user LND services for domain ${domainName}: ${error.message}`);
                            reject('Failed starting user LND services');
                            return;
                        }
                        if (stderr) {
                            console.log(`3/3 Stderr (error) chmod user LND services for domain ${domainName}: ${stderr}`);
                            reject('Failed starting user LND services');
                            return;
                        }
                        console.log(`3/3 Successfully chmod user LND services for domain: ${domainName}. Finishing whole process. Stdout: ${stdout}`);
                        resolve();
                    });
                });
            });
        }, 100);
    });
};
