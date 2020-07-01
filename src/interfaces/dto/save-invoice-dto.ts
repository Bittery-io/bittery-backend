export class SaveInvoiceDto {
    amount: number;
    currency: string;
    itemDesc: string;
    buyer: string;

    constructor(amount: number, currency: string, itemDesc: string, buyer: string) {
        this.amount = amount;
        this.currency = currency;
        this.itemDesc = itemDesc;
        this.buyer = buyer;
    }
}
