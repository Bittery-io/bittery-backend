import { Product } from './product';
import { BillingStatus } from './billing-status';

export class Billing {
    id: string;
    userEmail: string;
    product: Product;
    invoiceId: string;
    creationDate: string;
    paidToDate: string;
    status: BillingStatus;

    constructor(id: string, userEmail: string, product: Product, invoiceId: string, creationDate: string, paidToDate: string,
                status: BillingStatus) {
        this.id = id;
        this.userEmail = userEmail;
        this.product = product;
        this.invoiceId = invoiceId;
        this.creationDate = creationDate;
        this.paidToDate = paidToDate;
        this.status = status;
    }
}
