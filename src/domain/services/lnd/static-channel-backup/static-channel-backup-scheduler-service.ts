import { logError, logInfo, logWarn } from '../../../../application/logging-service';
import { findAllActiveLnds } from '../../../repository/lnd/lnds-repository';
import { Lnd } from '../../../model/lnd/lnd';
import { getAllStaticChannelBackupBase64 } from '../api/lnd-api-service';
import { LndStaticChannelBackup } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup';
import { generateUuid } from '../../utils/id-generator-service';
import { LndStaticChannelBackupType } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup-type';
import { insertLndStaticChannelBackups } from '../../../repository/lnd/static-channel-backup/lnd-static-channek-backup-repository';
import { addHoursGetDate, formatDateWithTime, getDifferenceInMilliseconds } from '../../utils/date-service';
import { LndStaticChannelBackupStatus } from '../../../model/lnd/static-channel-backup/lnd-static-channel-backup-status';

const schedule = require('node-schedule');
let nextBackupDateEpoch: number;
export const startStaticChannelBackupScheduler = () => {
    logInfo('Setting up LNDs SCB (static channel backup) every 12h scheduler');
    // every 12 hours
    schedule.scheduleJob('0 */12 * * *', async () => {
    // schedule.scheduleJob('* * * * *', async () => {
        nextBackupDateEpoch = addHoursGetDate(new Date().getTime(), 12);
        const lndStaticChannelBackups: LndStaticChannelBackup[] = [];
        logInfo(`[LNDs SCB SCHEDULER] 1/3 Starting at ${formatDateWithTime(new Date().getTime())}`);
        const lnds: Lnd[] = await findAllActiveLnds();
        logInfo(`[LNDs SCB SCHEDULER] 1/3  Found all LNDs in db: ${lnds.length}`);
        for (const lnd of lnds) {
            let backupBase64: string | undefined;
            let lndStaticChannelBackupStatus: LndStaticChannelBackupStatus;
            let message: string | undefined;
            if (lnd.macaroonHex) {
                try {
                    backupBase64 = await getAllStaticChannelBackupBase64(lnd.lndRestAddress, lnd.macaroonHex);
                    lndStaticChannelBackupStatus = LndStaticChannelBackupStatus.SUCCESS;
                } catch (err) {
                    logError(`[LNDs SCB SCHEDULER] 2/3 Could not get SCB for LND with id ${lnd.lndId} because returned backup is empty!`);
                    // 404 is returned when LN is turned off
                    if (err.response !== undefined && err.response.status === 404) {
                        lndStaticChannelBackupStatus = LndStaticChannelBackupStatus.FAILURE_NODE_LOCKED;
                    } else {
                        lndStaticChannelBackupStatus = LndStaticChannelBackupStatus.FAILURE;
                    }
                    message = err.message;
                }
            } else {
                // tslint:disable-next-line:max-line-length
                logWarn(`[LNDs SCB SCHEDULER] 2/3 Could not get static channel backup for LND with id ${lnd.lndId} because has no macaroon yet in db!`);
                lndStaticChannelBackupStatus = LndStaticChannelBackupStatus.FAILURE_NO_MACAROON;
            }

            lndStaticChannelBackups.push(new LndStaticChannelBackup(
                generateUuid(),
                lnd.lndId,
                new Date().toISOString(),
                LndStaticChannelBackupType.SCHEDULED,
                lndStaticChannelBackupStatus,
                backupBase64,
                message,
            ));
        }
        logInfo(`[LNDs SCB SCHEDULER] 2/3 Obtained static channel backups for ${lndStaticChannelBackups.length}/${lnds.length} LNDs`);
        if (lndStaticChannelBackups.length > 0) {
            await insertLndStaticChannelBackups(lndStaticChannelBackups);
        }
        logInfo(`[LNDs SCB SCHEDULER] 3/3 Successfully saved ${lndStaticChannelBackups.length} LNDs static channel backups!`);
    });
};

export const getMillisecondsToNextStaticChannekBackup = (): number => {
    return getDifferenceInMilliseconds(nextBackupDateEpoch, new Date().getTime());
};
// startAllServicesAtStart();
