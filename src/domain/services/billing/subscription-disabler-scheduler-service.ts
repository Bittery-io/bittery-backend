import { logInfo } from '../../../application/logging-service';
import { addHoursGetDate, formatDateWithTime } from '../utils/date-service';
import { findBillingsWithStatusWherePaidToDateIsInPastAndIsNotYetArchived } from '../../repository/lnd-billings-repository';
import { BillingStatus } from '../../model/billings/billing-status';
import { LndBilling } from '../../model/billings/lnd-billing';
import { NotificationReasonEnum } from '../../model/notification/notification-reason-enum';
import { backupLndFolderAndGetFileName } from '../lnd/backup/backup-lnd-folder-service';
import { findUserLnd } from '../../repository/lnd/lnds-repository';
import { Lnd } from '../../model/lnd/lnd';
import { deleteDigitalOceanDroplet } from '../lnd/provisioning/digital-ocean-disable-droplet-service';
import { DigitalOceanLndForRestart } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd-for-restart';
import { insertDigitalOceanArchive } from '../../repository/lnd/digital-ocean/digital-ocean-archives-repository';
import { DigitalOceanArchive } from '../../model/lnd/digital-ocean-archive';
import { findDigitalOceanLndForRestart } from '../../repository/lnd/digital-ocean/digital-ocean-lnds-repository';
import { sendEmailNotificationIfNotYetSend } from './scan-subscription-scheduler-service';

const schedule = require('node-schedule');
let nextSchedulerDateEpoch: number;

export const subscriptionDisableScheduler = () => {
    logInfo('Setting up BITTERY DISABLE scheduler check every 12h scheduler');
    // every 12 hours
    // schedule.scheduleJob('0 */12 * * *', async () => {
    schedule.scheduleJob('* * * * *', async () => {
        logInfo(`[Subscription DISABLE scheduler] 1/3 Starting subscriptions status scheduler at ${formatDateWithTime(new Date().getTime())}`);
        nextSchedulerDateEpoch = addHoursGetDate(new Date().getTime(), 12);
        const paidBillingsForLndsWhichShouldBeDisabled: LndBilling[] =
            await findBillingsWithStatusWherePaidToDateIsInPastAndIsNotYetArchived(BillingStatus.PAID);
        logInfo(`[Subscription DISABLE scheduler] 2/3 Found all paid billings for valid subscription in db: ${paidBillingsForLndsWhichShouldBeDisabled.length}`);
        for (const billing of paidBillingsForLndsWhichShouldBeDisabled) {
            await disableLndDroplet(billing);
            await sendEmailNotificationIfNotYetSend(billing, NotificationReasonEnum.SUBSCRIPTION_ENDED);
        }
    });
};

const disableLndDroplet = async (billing: LndBilling): Promise<void> => {
    const backupedLndFileName: string = await backupLndFolderAndGetFileName(billing.lndId, billing.userEmail);
    const digitalOceanLndForRestart: DigitalOceanLndForRestart | undefined =
        await findDigitalOceanLndForRestart(billing.lndId, billing.userEmail);
    await deleteDigitalOceanDroplet(digitalOceanLndForRestart?.dropletId!);
    await insertDigitalOceanArchive(new DigitalOceanArchive(
        billing.lndId,
        new Date().toISOString(),
        backupedLndFileName,
    ));
    logInfo(`Successfully disabled, deleted and archived lnd with id ${billing.lndId} for user email ${billing.userEmail}`);
};
