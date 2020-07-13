import { NotificationTypeEnum } from './notification-type-enum';
import { NotificationReasonEnum } from './notification-reason-enum';

export class Notification {
    userEmail: string;
    notificationId: string;
    notificationType: NotificationTypeEnum;
    notificationReason: NotificationReasonEnum;
    notificationSendDate: string;

    constructor(userEmail: string, notificationId: string,
                notificationType: NotificationTypeEnum, notificationReason: NotificationReasonEnum,
                notificationSendDate: string) {
        this.userEmail = userEmail;
        this.notificationId = notificationId;
        this.notificationType = notificationType;
        this.notificationReason = notificationReason;
        this.notificationSendDate = notificationSendDate;
    }
}
