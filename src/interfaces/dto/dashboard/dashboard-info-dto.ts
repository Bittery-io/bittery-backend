export class DashboardInfoDto {
    totalInvoicedAmountBtc: number;
    newInvoicedAmountBtc: number;
    paidInvoicedAmountBtc: number;
    expiredInvoicedAmountBtc: number;
    invoicesQuantity: number;
    newInvoicesQuantity: number;
    paidInvoicesQuantity: number;
    expiredInvoicesQuantity: number;

    timeframes: string[];
    paidInvoicesAmountTimeframesValues: number[];

    newInvoicesQuantityTimeframesValues: number[];
    paidInvoicesQuantityTimeframesValues: number[];
    expiredInvoicesQuantityTimeframesValues: number[];
    invoices: object[];
    totalReceivedViaLightning: string;
    totalReceivedViaTransactions: string;
    constructor(totalInvoicedAmountBtc: number,
                newInvoicedAmountBtc: number,
                paidInvoicedAmountBtc: number,
                expiredInvoicedAmountBtc: number,
                invoicesQuantity: number,
                newInvoicesQuantity: number,
                paidInvoicesQuantity: number,
                expiredInvoicesQuantity: number,
                timeframes: string[],
                paidInvoicesAmountTimeframesValues: number[],
                newInvoicesQuantityTimeframesValues: number[],
                paidInvoicesQuantityTimeframesValues: number[],
                expiredInvoicesQuantityTimeframesValues: number[],
                invoices: object[],
                totalReceivedViaLightning: string,
                totalReceivedViaTransactions: string) {
        this.totalInvoicedAmountBtc = totalInvoicedAmountBtc;
        this.newInvoicedAmountBtc = newInvoicedAmountBtc;
        this.paidInvoicedAmountBtc = paidInvoicedAmountBtc;
        this.expiredInvoicedAmountBtc = expiredInvoicedAmountBtc;
        this.invoicesQuantity = invoicesQuantity;
        this.newInvoicesQuantity = newInvoicesQuantity;
        this.paidInvoicesQuantity = paidInvoicesQuantity;
        this.expiredInvoicesQuantity = expiredInvoicesQuantity;
        this.timeframes = timeframes;
        this.paidInvoicesAmountTimeframesValues = paidInvoicesAmountTimeframesValues;
        this.newInvoicesQuantityTimeframesValues = newInvoicesQuantityTimeframesValues;
        this.paidInvoicesQuantityTimeframesValues = paidInvoicesQuantityTimeframesValues;
        this.expiredInvoicesQuantityTimeframesValues = expiredInvoicesQuantityTimeframesValues;
        this.invoices = invoices;
        this.totalReceivedViaLightning = totalReceivedViaLightning;
        this.totalReceivedViaTransactions = totalReceivedViaTransactions;
    }
}
