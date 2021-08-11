export class StoreInvoice {
    storeId: string;
    orderId: string;
    invoiceId: string;
    creationDate: Date;

    constructor(storeId: string, orderId: string, invoiceId: string, creationDate: Date) {
        this.storeId = storeId;
        this.orderId = orderId;
        this.invoiceId = invoiceId;
        this.creationDate = creationDate;
    }
}
