export class SubscriptionEmailNotification {
    userEmail: string;
    notificationId: string;
    lndBillingId: string;

    constructor(userEmail: string, notificationId: string, lndBillingId: string) {
        this.userEmail = userEmail;
        this.notificationId = notificationId;
        this.lndBillingId = lndBillingId;
    }
}
