export class SubscriptionDtoSpecialDiscountDto {
    month: number;
    discount: number;

    constructor(month: number, discount: number) {
        this.month = month;
        this.discount = discount;
    }
}
