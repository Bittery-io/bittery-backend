import { BillingStatus } from './billing-status';

export class LndBilling {
    id: string;
    userEmail: string;
    lndId: string;
    invoiceId: string;
    creationDate: string;
    subscriptionMonths: number;
    status: BillingStatus;
    paidToDate?: string;

    constructor(id: string, userEmail: string, lndId: string, invoiceId: string, creationDate: string,
                status: BillingStatus, subscriptionMonths: number, paidToDate?: string) {
        this.id = id;
        this.userEmail = userEmail;
        this.lndId = lndId;
        this.invoiceId = invoiceId;
        this.creationDate = creationDate;
        this.status = status;
        this.subscriptionMonths = subscriptionMonths;
        this.paidToDate = paidToDate;
    }
}
