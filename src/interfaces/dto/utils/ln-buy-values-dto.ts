export class LnBuyValuesDto {
    lndVersion: string;
    lndPriceUsd: number;

    constructor(lndVersion: string, lndDollarPrice: number) {
        this.lndVersion = lndVersion;
        this.lndPriceUsd = lndDollarPrice;
    }
}
