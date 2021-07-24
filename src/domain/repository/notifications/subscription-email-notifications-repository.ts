import { PoolClient } from 'pg';
import { SubscriptionEmailNotification } from '../../model/notification/subscription-email-notification';
import { dbPool } from '../../../application/db/db';
import { NotificationReasonEnum } from '../../model/notification/notification-reason-enum';

export const insertSubscriptionEmailNotification = async (client: PoolClient,
                                                          subscriptionEmailNotification: SubscriptionEmailNotification): Promise<void> => {
    await client.query(`
                INSERT INTO SUBSCRIPTION_EMAIL_NOTIFICATIONS(USER_EMAIL, NOTIFICATION_ID, LND_BILLING_ID)
                VALUES ($1, $2, $3)`,
        [subscriptionEmailNotification.userEmail,
            subscriptionEmailNotification.notificationId,
            subscriptionEmailNotification.lndBillingId]);
};

export const existsSubscriptionEmailNotification = async (
        userEmail: string, billingId: string, notificationReasonEnum: NotificationReasonEnum): Promise<boolean> => {
    const result = await dbPool.query(
        `SELECT EXISTS(SELECT 1 FROM SUBSCRIPTION_EMAIL_NOTIFICATIONS sen
                        JOIN NOTIFICATIONS n ON sen.NOTIFICATION_ID  = n.id
                        WHERE sen.USER_EMAIL = $1 AND sen.LND_BILLING_ID = $2 AND n.NOTIFICATION_REASON = $3)`,
        [userEmail, billingId, notificationReasonEnum]);
    return result.rows[0].exists;
};
