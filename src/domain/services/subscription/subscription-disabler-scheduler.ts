import { logError, logInfo } from '../../../application/logging-service';
import { addHoursGetDate, formatDateWithTime } from '../utils/date-service';
import { findBillingsWithStatusWherePaidToDateIsInPastAndIsNotYetArchived } from '../../repository/lnd-billings-repository';
import { BillingStatus } from '../../model/billings/billing-status';
import { LndBilling } from '../../model/billings/lnd-billing';
import { NotificationReasonEnum } from '../../model/notification/notification-reason-enum';
import { backupLndFolderAndGetFileName } from '../lnd/backup/backup-lnd-folder-service';
import { deleteDigitalOceanDroplet } from '../lnd/provisioning/digital-ocean-disable-droplet-service';
import { DigitalOceanLndForRestart } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';
import { insertDigitalOceanArchive } from '../../repository/lnd/digital-ocean/digital-ocean-archives-repository';
import { DigitalOceanArchive } from '../../model/lnd/digital-ocean-archive';
import { findDigitalOceanLndForRestart } from '../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';
import { sendEmailNotificationIfNotYetSend } from './subscription-renew-email-scheduler';
import { runInTransaction } from '../../../application/db/db-transaction';
import { updateLndSetIsActive } from '../../repository/lnd/lnds-repository';
import { DisableSubscriptionException } from '../../model/subscription/disable-subscription-exception';
import { DisableSubscriptionStageErrorType } from '../../model/subscription/disable-subscription-stage-error-type';
import { sendDisablingSubscriptionFailed } from '../../../application/mail-service';

const schedule = require('node-schedule');
let nextSchedulerDateEpoch: number;

export const startSubscriptionDisableScheduler = () => {
    logInfo('Setting up BITTERY DISABLE scheduler check every 12h scheduler');
    // every 12 hours
    // schedule.scheduleJob('0 */12 * * *', async () => {
    schedule.scheduleJob('* * * * *', async () => {
        logInfo(`[SUBSCRIPTION DISABLE SCHEDULER] 1/3 Starting at ${formatDateWithTime(new Date().getTime())}`);
        nextSchedulerDateEpoch = addHoursGetDate(new Date().getTime(), 12);
        const paidBillingsForLndsWhichShouldBeDisabled: LndBilling[] =
            await findBillingsWithStatusWherePaidToDateIsInPastAndIsNotYetArchived(BillingStatus.PAID);
        logInfo(`[SUBSCRIPTION DISABLE SCHEDULER] 2/3 Found all paid billings for valid subscriptions: ${paidBillingsForLndsWhichShouldBeDisabled.length}`);
        let success: number = 0;
        let failed: number = 0;
        const total: number = paidBillingsForLndsWhichShouldBeDisabled.length;
        for (const billing of paidBillingsForLndsWhichShouldBeDisabled) {
            try {
                const backupNameWithExtension: string = await backupLndAndGetBackupName(billing);
                await deleteDroplet(billing);
                await updateDatabaseAfterSubscriptionDisable(backupNameWithExtension, billing);
                logInfo(`[SUBSCRIPTION DISABLE SCHEDULER] 2.1/3 Successfully disabled, deleted and archived lnd with id ${billing.lndId} for user email ${billing.userEmail}`);
                await sendEmailNotificationIfNotYetSend(billing, NotificationReasonEnum.SUBSCRIPTION_ENDED);
                logInfo(`[SUBSCRIPTION DISABLE SCHEDULER] 2.2/3 Successfully sent LND disabled email for lnd with id ${billing.lndId} for user email ${billing.userEmail}`);
                success += 1;
            } catch (err) {
                const exception: DisableSubscriptionException = err;
                logError(`[SUBSCRIPTION DISABLE SCHEDULER] 2.3/3 Failed to disable LND for lnd id ${billing.lndId} and user email ${billing.userEmail}. Failed on stage: ${err.failedDeploymentStage}. Message: ${err.message}`);
                await sendDisablingSubscriptionFailed(billing.userEmail, billing.lndId, exception);
                failed += 1;
            }
        }
        logInfo(`[SUBSCRIPTION DISABLE SCHEDULER] 3/3 Ending at ${formatDateWithTime(new Date().getTime())}. Processed, success ${success}/${total}, failed ${failed}/${total}`);
    });
};

const backupLndAndGetBackupName = async (lndBilling: LndBilling) => {
    try {
        return await backupLndFolderAndGetFileName(lndBilling.lndId, lndBilling.userEmail);
    } catch (err) {
        throw new DisableSubscriptionException(err.message, DisableSubscriptionStageErrorType.BACKUP_LND_ERROR);
    }
};

const deleteDroplet = async (billing: LndBilling) => {
    try {
        const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined =
            await findDigitalOceanLndForRestart(billing.lndId, billing.userEmail);
        return await deleteDigitalOceanDroplet(digitalOceanLndForRestart!.dropletId);
    } catch (err) {
        throw new DisableSubscriptionException(err.message, DisableSubscriptionStageErrorType.DELETE_DROPLET_ERROR);
    }
};

const updateDatabaseAfterSubscriptionDisable = async (backupFileNameWithExtension: string, billing: LndBilling) => {
    try {
        await runInTransaction(async (client) => {
            await insertDigitalOceanArchive(client, new DigitalOceanArchive(
                billing.lndId,
                new Date().toISOString(),
                backupFileNameWithExtension,
            ));
            await updateLndSetIsActive(client, billing.lndId, false);
        });
    } catch (err) {
        throw new DisableSubscriptionException(err.message, DisableSubscriptionStageErrorType.DATABASE_UPDATE_ERROR);
    }
};
