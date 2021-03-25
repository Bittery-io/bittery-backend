import { Product } from '../../../domain/model/billings/product';
import { BillingStatus } from '../../../domain/model/billings/billing-status';

export class BillingDto {
    invoiceTime: number;
    description: string;
    product: Product;
    invoiceId: string;
    paidToDate: number;
    status: BillingStatus;
    btcPrice: string;
    btcPaid: string;
    currency: string;
    price: number;

    constructor(invoiceTime: number, description: string, product: Product, invoiceId: string, paidToDate: number, status: BillingStatus,
                btcPrice: string, btcPaid: string, currency: string, price: number) {
        this.invoiceTime = invoiceTime;
        this.description = description;
        this.product = product;
        this.invoiceId = invoiceId;
        this.paidToDate = paidToDate;
        this.status = status;
        this.btcPrice = btcPrice;
        this.btcPaid = btcPaid;
        this.currency = currency;
        this.price = price;
    }
}
