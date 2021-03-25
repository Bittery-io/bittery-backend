import { SubscriptionStatus } from '../../../domain/model/account/subscription-status';
import { SubscriptionDtoSpecialDiscountDto } from './subscription-dto-special-discount-dto';
import { SubscriptionPlan } from '../../../domain/model/account/subscription-plan';

export class SubscriptionDto {

    subscriptionStatus: SubscriptionStatus;
    paidToDate: number;
    subscriptionPlan: SubscriptionPlan;
    monthlyPrice: string;
    specialDiscounts: SubscriptionDtoSpecialDiscountDto[];

    constructor(subscriptionStatus: SubscriptionStatus, paidToDate: number,
                subscriptionPlan: SubscriptionPlan, monthlyPrice: string,
                specialDiscounts: SubscriptionDtoSpecialDiscountDto[]) {
        this.subscriptionStatus = subscriptionStatus;
        this.paidToDate = paidToDate;
        this.subscriptionPlan = subscriptionPlan;
        this.monthlyPrice = monthlyPrice;
        this.specialDiscounts = specialDiscounts;
    }
}
