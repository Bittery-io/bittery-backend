import { getProperty } from '../../../../application/property-service';
import { LndRun } from '../../../model/lnd/run/lnd-run';
import { formatDateWithTime } from '../../utils/date-service';

const { exec } = require('child_process');

export const stopLnds = async (lndRuns: LndRun[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const lndUserDomainNamesString: string = getLndUserDomainsString(lndRuns);
            console.log(`Stopping ${lndRuns.length} LNDs [${lndUserDomainNamesString}]. Stop time: ${formatDateWithTime(new Date().getTime())}`);
            // tslint:disable-next-line:max-line-length
            exec(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/stop-lnds.sh ${lndUserDomainNamesString}`, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.log(`Error stopping ${lndRuns.length} LNDs [${lndUserDomainNamesString}]: ${error.message}`);
                    reject('Failed stopping LNDs');
                    return;
                }
                if (stderr) {
                    console.log(`1 Stderr (error) stopping ${lndRuns.length} LNDs [${lndUserDomainNamesString}]: ${stderr}`);
                    reject('Failed stopping LNDs');
                    return;
                }
                resolve();
            });
        }, 100);
    });
};

export const startLnds = async (lndRuns: LndRun[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        const lndUserDomainNamesString: string = getLndUserDomainsString(lndRuns);
        setTimeout(() => {
            console.log(`Starting ${lndRuns.length} LNDs [${lndUserDomainNamesString}]. Starting time: ${formatDateWithTime(new Date().getTime())}`);
            // tslint:disable-next-line:max-line-length
            exec(`${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/start-lnds.sh ${lndUserDomainNamesString}`, (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.log(`Error starting ${lndRuns.length} LNDs [${lndUserDomainNamesString}]: ${error.message}`);
                    reject('Failed starting LNDs');
                    return;
                }
                if (stderr) {
                    console.log(`1 Stderr (error) starting ${lndRuns.length} LNDs [${lndUserDomainNamesString}]: ${stderr}`);
                    reject('Failed starting LNDs');
                    return;
                }
                resolve();
            });
        }, 100);
    });
};

const getLndUserDomainsString = (lndRuns: LndRun[]): string => {
    let lndUserDomainNamesString: string = '';
    lndRuns.forEach((lndRun) => {
        lndUserDomainNamesString = `${lndUserDomainNamesString} ${lndRun.userDomain}`;
    });
    return lndUserDomainNamesString.substring(1, lndUserDomainNamesString.length);
};
