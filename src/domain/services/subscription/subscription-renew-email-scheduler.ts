import { logInfo } from '../../../application/logging-service';
import { addHoursGetDate, formatDateWithTime, isNowPlusGivenDaysAfterGivenDate } from '../utils/date-service';
import { findBillingsWithStatusWherePaidToDateIsInFuture } from '../../repository/lnd-billings-repository';
import { BillingStatus } from '../../model/billings/billing-status';
import { LndBilling } from '../../model/billings/lnd-billing';
import { sendSubscriptionEndsSoonEmail, subscriptionEndedEmail } from '../../../application/mail-service';
import {
    existsSubscriptionEmailNotification,
    insertSubscriptionEmailNotification,
} from '../../repository/notifications/subscription-email-notifications-repository';
import { runInTransaction } from '../../../application/db/db-transaction';
import { insertNotification } from '../../repository/notifications/notifications-repository';
import { Notification } from '../../model/notification/notification';
import { NotificationTypeEnum } from '../../model/notification/notification-type-enum';
import { NotificationReasonEnum } from '../../model/notification/notification-reason-enum';
import { SubscriptionEmailNotification } from '../../model/notification/subscription-email-notification';
import { generateUuid } from '../utils/id-generator-service';

const schedule = require('node-schedule');
let nextSchedulerDateEpoch: number;

export const startSubscriptionRenewEmailScheduler = () => {
    logInfo('Setting up BITTERY SUBSCRIPTION RENEW EMAIL SCHEDULER invoices check every 12h scheduler');
    // every 12 hours
    // schedule.scheduleJob('0 */12 * * *', async () => {
    schedule.scheduleJob('* * * * *', async () => {
        logInfo(`[SUBSCRIPTION RENEW EMAIL SCHEDULER] 1/3 Starting at ${formatDateWithTime(new Date().getTime())}`);
        nextSchedulerDateEpoch = addHoursGetDate(new Date().getTime(), 12);
        const paidBillingsForValidSubscription: LndBilling[] = await findBillingsWithStatusWherePaidToDateIsInFuture(BillingStatus.PAID);
        // tslint:disable-next-line:max-line-length
        logInfo(`[SUBSCRIPTION RENEW EMAIL SCHEDULER] 2/3 Found all paid billings for valid subscription in db: ${paidBillingsForValidSubscription.length}`);
        for (const billing of paidBillingsForValidSubscription) {
            if (isNowPlusGivenDaysAfterGivenDate(new Date(billing.paidToDate).getTime(), 3)) {
                await sendEmailNotificationIfNotYetSend(billing, NotificationReasonEnum.SUBSCRIPTION_ENDS_IN_3_DAYS);
            } else if (isNowPlusGivenDaysAfterGivenDate(new Date(billing.paidToDate).getTime(), 7)) {
                await sendEmailNotificationIfNotYetSend(billing, NotificationReasonEnum.SUBSCRIPTION_ENDS_IN_7_DAYS);
            }
        }
        logInfo(`[SUBSCRIPTION RENEW EMAIL SCHEDULER] 1/3 Finished at ${formatDateWithTime(new Date().getTime())}`);
    });
};

export const sendEmailNotificationIfNotYetSend = async (billing: LndBilling, notificationReasonEnum: NotificationReasonEnum) => {
    if (!(await existsSubscriptionEmailNotification(billing.userEmail, billing.id, notificationReasonEnum))) {
        let messageId: string | undefined = undefined;
        switch (notificationReasonEnum) {
            case NotificationReasonEnum.SUBSCRIPTION_ENDS_IN_3_DAYS:
                messageId = await sendSubscriptionEndsSoonEmail(billing.userEmail, 3, new Date(billing.paidToDate));
                break;
            case NotificationReasonEnum.SUBSCRIPTION_ENDS_IN_7_DAYS:
                messageId = await sendSubscriptionEndsSoonEmail(billing.userEmail, 7, new Date(billing.paidToDate));
                break;
            case NotificationReasonEnum.SUBSCRIPTION_ENDED:
                messageId = await subscriptionEndedEmail(billing.userEmail);
                break;
        }
        if (messageId) {
            await runInTransaction(async (client) => {
                const notificationId: string = generateUuid();
                await insertNotification(client, new Notification(
                    notificationId,
                    billing.userEmail,
                    messageId!,
                    NotificationTypeEnum.EMAIL,
                    NotificationReasonEnum.SUBSCRIPTION_ENDS_IN_3_DAYS,
                    new Date().toISOString(),
                ));
                await insertSubscriptionEmailNotification(client, new SubscriptionEmailNotification(
                    billing.userEmail,
                    notificationId,
                    billing.id,
                ));
            });
        }
    }
};
