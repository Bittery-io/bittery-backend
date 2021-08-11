import { InvoiceData, InvoicePaymentMethodDataModel } from 'btcpay-greenfield-node-client';

export class BtcpayInvoice {
    invoiceData: InvoiceData;
    invoicePayments: InvoicePaymentMethodDataModel[];

    constructor(invoiceData: InvoiceData, invoicePayments: InvoicePaymentMethodDataModel[]) {
        this.invoiceData = invoiceData;
        this.invoicePayments = invoicePayments;
    }
}
