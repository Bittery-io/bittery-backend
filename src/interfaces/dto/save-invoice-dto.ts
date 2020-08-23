import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SaveInvoiceDto {

    @IsString()
    amount: string;

    @IsString()
    currency: string;

    @IsString()
    @IsOptional()
    itemDesc?: string;

    @IsString()
    @IsOptional()
    buyer?: string;

    constructor(amount: string, currency: string, itemDesc: string, buyer: string) {
        this.amount = amount;
        this.currency = currency;
        this.itemDesc = itemDesc;
        this.buyer = buyer;
    }
}
