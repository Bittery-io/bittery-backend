import { dbPool } from '../../application/db/db';
import { Notification } from '../model/notification/notification';
import { NotificationTypeEnum } from '../model/notification/notification-type-enum';
import { PoolClient } from 'pg';

export const insertNotification = async (client: PoolClient, notification: Notification): Promise<void> => {
    await client.query(`
                INSERT INTO NOTIFICATIONS(USER_EMAIL, NOTIFICATION_ID, NOTIFICATION_TYPE, NOTIFICATION_REASON,
                                          NOTIFICATION_SEND_DATE)
                VALUES ($1, $2, $3, $4, $5)`,
        [notification.userEmail,
            notification.notificationId,
            notification.notificationType,
            notification.notificationReason,
            notification.notificationSendDate]);
};

// Find all notification from now - periodHours for given users
// if user sent more than could: return false
export const notificationsLimitNotExceededForUser = async (
        userEmail: string,
        notificationType: NotificationTypeEnum,
        periodHours: number,
        limit: number): Promise<boolean> => {
    const result = await dbPool.query(`
        SELECT COUNT(*) FROM NOTIFICATIONS WHERE USER_EMAIL = $1 AND NOTIFICATION_TYPE = $2 AND
        NOTIFICATION_SEND_DATE > NOW() - INTERVAL '${periodHours} hours'`, [userEmail, notificationType]);
    return result.rows[0].count < limit;
};
