import { BillingStatus } from './billing-status';

export class LndBilling {
    id: string;
    userEmail: string;
    lndId: string;
    invoiceId: string;
    creationDate: string;
    paidToDate: string;
    status: BillingStatus;

    constructor(id: string, userEmail: string, lndId: string, invoiceId: string, creationDate: string, paidToDate: string,
                status: BillingStatus) {
        this.id = id;
        this.userEmail = userEmail;
        this.lndId = lndId;
        this.invoiceId = invoiceId;
        this.creationDate = creationDate;
        this.paidToDate = paidToDate;
        this.status = status;
    }
}
