import { NotificationTypeEnum } from './notification-type-enum';
import { NotificationReasonEnum } from './notification-reason-enum';

export class Notification {
    id: string;
    userEmail: string;
    notificationMessageId: string;
    notificationType: NotificationTypeEnum;
    notificationReason: NotificationReasonEnum;
    notificationSendDate: string;

    constructor(id: string, userEmail: string, notificationMessageId: string,
                notificationType: NotificationTypeEnum, notificationReason: NotificationReasonEnum,
                notificationSendDate: string) {
        this.id = id;
        this.userEmail = userEmail;
        this.notificationMessageId = notificationMessageId;
        this.notificationType = notificationType;
        this.notificationReason = notificationReason;
        this.notificationSendDate = notificationSendDate;
    }
}
