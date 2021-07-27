import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { InvoiceValidityType } from '../../domain/model/payments/invoice-validity-type';

export class SaveInvoiceDto {

    @IsString()
    amount: string;

    @IsString()
    currency: string;

    @IsDefined()
    @IsEnum(InvoiceValidityType)
    invoiceValidity: InvoiceValidityType;

    @IsString()
    @IsOptional()
    itemDesc?: string;

    @IsString()
    @IsOptional()
    buyer?: string;

    constructor(amount: string, currency: string, invoiceValidity: InvoiceValidityType, itemDesc?: string, buyer?: string) {
        this.amount = amount;
        this.currency = currency;
        this.invoiceValidity = invoiceValidity;
        this.itemDesc = itemDesc;
        this.buyer = buyer;
    }
}
