import { deleteRunRequests, findLndRunRequestsToStart } from '../../repository/lnd-run/lnd-run-requests-repository';
import { LndRunRequest } from '../../model/lnd/run/lnd-run-request';
import { deleteLndRuns, findAllLndRuns, insertLndRuns } from '../../repository/lnd-run/lnd-runs-repository';
import { LndRun } from '../../model/lnd/run/lnd-run';
import { startLnds, stopLnds } from '../lnd/run/manage-lnds-service';
import { logInfo } from '../../../application/logging-service';
import { runInTransaction } from '../../../application/db/db-transaction';
import { PoolClient } from 'pg';
import { findNewestRegistrationUserDomains } from '../../repository/user-domains-repository';
import { UserDomain } from '../../model/lnd/user-domain';

const schedule = require('node-schedule');

const RUNNING_LNDS_LIMIT = 30;

const startAllServicesAtStart = async () => {
    logInfo('LNDs init: starting LNDs initialization service - cleaning the database and stopping/starting LNDs');
    const lndRuns: LndRun[] = await findAllLndRuns();
    await stopLnds(lndRuns);
    logInfo(`LNDs init: stopped ${lndRuns.length} running LNDs`);

    // Include requests if there are any and fill with
    const lndRunRequests: LndRunRequest[] = await findLndRunRequestsToStart(RUNNING_LNDS_LIMIT);
    const possibleToRunCounter: number = RUNNING_LNDS_LIMIT - lndRunRequests.length;
    const newestRegisteredUserDomains: UserDomain[] = await findNewestRegistrationUserDomains(possibleToRunCounter);
    const newLndRunsToStart: LndRun[] = [];
    lndRunRequests.forEach(lndRunRequest => newLndRunsToStart.push(new LndRun(lndRunRequest.userDomain, new Date().toISOString())));
    newestRegisteredUserDomains.forEach(userDomain => newLndRunsToStart.push(new LndRun(userDomain.userDomain, new Date().toISOString())));

    await runInTransaction(async (client: PoolClient) => {
        await deleteLndRuns(client, lndRuns);
        await deleteRunRequests(client, lndRunRequests);
        await insertLndRuns(client, newLndRunsToStart);
    });
    await startLnds(newLndRunsToStart);
    logInfo(`LNDs init: started ${newLndRunsToStart.length} new LNDs (including pending requests). Finish init and starting scheduler.`);
    startScheduler();
};

export const startScheduler = () => {
    // every 4 hours
    schedule.scheduleJob('0 0,4,8,12,16,20 * * *', async () => {
        logInfo('Starting restart LNDs scheduler');
        const lndRuns: LndRun[] = await findAllLndRuns();
        logInfo(`1/6 Found LND runs in the db: ${lndRuns.length}`);

        let lndRunRequests: LndRunRequest[] = await findLndRunRequestsToStart(RUNNING_LNDS_LIMIT);
        // If there is request for whose LND is already running - skip this request
        lndRunRequests = lndRunRequests.filter(lndRunRequest => lndRuns
            .filter(lndRun => lndRun.userDomain === lndRunRequest.userDomain).length === 0);
        logInfo(`2/6 Found LND run requests in the db (after filter of running): ${lndRunRequests.length}`);
        if (lndRunRequests.length > 0) {

            let lndRunsToStopCount: number;
            if (lndRunRequests.length + lndRuns.length <= RUNNING_LNDS_LIMIT) {
                lndRunsToStopCount = 0;
            } else {
                // The point is to minimize the necessity of stopping LNDs and always have 30 running
                // but if there is not enough requests to run - existing can still run - we should not stop them
                lndRunsToStopCount = (lndRunRequests.length + lndRuns.length) - RUNNING_LNDS_LIMIT;
            }
            logInfo(`3/6 Due to limit ${RUNNING_LNDS_LIMIT} must stop LND running: ${lndRunsToStopCount}`);

            let lndRunsToStop: LndRun[] = [];
            if (lndRunsToStopCount > 0) {
                lndRuns.sort((a, b) => {
                    // @ts-ignore
                    return new Date(b.runStartDate) - new Date(a.runStartDate);
                });
                lndRunsToStop = lndRuns.slice(0, lndRunsToStopCount);
                await stopLnds(lndRunsToStop);
            }
            logInfo(`4/6 Stopped LND runs (the oldest running): ${lndRunsToStopCount}`);

            const newLndRuns: LndRun[] = lndRunRequests.map(lndRunRequest => new LndRun(lndRunRequest.userDomain, new Date().toISOString()));
            await runInTransaction(async (client: PoolClient) => {
                await deleteLndRuns(client, lndRunsToStop);
                await deleteRunRequests(client, lndRunRequests);
                await insertLndRuns(client, newLndRuns);
            });
            logInfo(`5/6 Deleted stopped LND runs, deleted LND run requests. Inserted new LND runs to the db: ${newLndRuns.length}`);

            if (newLndRuns.length > 0) {
                await startLnds(newLndRuns);
            }
            logInfo(`6/6 Started new LND runs from LND run requests: ${newLndRuns.length}`);
        }
        logInfo('Stopping restart LNDs scheduler');

    });
};

// startAllServicesAtStart();
