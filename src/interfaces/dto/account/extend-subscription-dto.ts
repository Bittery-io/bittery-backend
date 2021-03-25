import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class ExtendSubscriptionDto {

    @IsNumber()
    @IsPositive()
    @IsInt()
    subscriptionTimeMonths: number;

    constructor(subscriptionTimeMonths: number) {
        this.subscriptionTimeMonths = subscriptionTimeMonths;
    }
}
