import { Product } from '../../../domain/model/billings/product';
import { BillingStatus } from '../../../domain/model/billings/billing-status';

export class BillingDto {
    invoiceTime: number;
    product: Product;
    invoiceId: string;
    paidToDate: number;
    status: BillingStatus;
    lndId: string;
    invoice: any;
    constructor(invoiceTime: number, product: Product, invoiceId: string, paidToDate: number, status: BillingStatus,
                lndId: string, invoice: any) {
        this.invoiceTime = invoiceTime;
        this.product = product;
        this.invoiceId = invoiceId;
        this.paidToDate = paidToDate;
        this.status = status;
        this.lndId = lndId;
        this.invoice = invoice;
    }
}
