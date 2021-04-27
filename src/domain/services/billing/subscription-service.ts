import {
    findBillingsNewestFirst,
    findLatestCreatedBillingWithStatus,
    insertBilling,
} from '../../repository/billings-repository';
import { Product } from '../../model/billings/product';
import { Billing } from '../../model/billings/billing';
import { BillingStatus } from '../../model/billings/billing-status';
import { addMonthsToDate, isFirstDateAfterSecond } from '../utils/date-service';
import { BtcpayInvoice } from '../../model/btcpay/btcpay-invoice';
import { getBitteryInvoice, saveBitteryInvoice } from '../payments/bittery-invoice-service';
import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { runInTransaction } from '../../../application/db/db-transaction';
import { generateUuid } from '../utils/id-generator-service';
import { logError, logInfo } from '../../../application/logging-service';
import { SubscriptionStatus } from '../../model/account/subscription-status';
import { SubscriptionDto } from '../../../interfaces/dto/account/subscription-dto';
import { findUserHostedLndType } from '../../repository/lnd/lnd-hosted-repository';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { ExtendSubscriptionDto } from '../../../interfaces/dto/account/extend-subscription-dto';
import { SubscriptionPlan } from '../../model/account/subscription-plan';
import { BillingDto } from '../../../interfaces/dto/account/billing-dto';
import { Invoice } from 'btcpay';

const BITTERY_SUBSCRIPTION_PRICE_USD = 29.0;

export const extendSubscription = async (userEmail: string, extendSubscriptionDto: ExtendSubscriptionDto): Promise<string | undefined> => {
    const latestPaidUserBilling: Billing = (await findLatestCreatedBillingWithStatus(
        userEmail, Product.LND, BillingStatus.PAID))!;
    const latestPaidToTime: number = new Date(latestPaidUserBilling.paidToDate).getTime();
    if (isFirstDateAfterSecond(latestPaidToTime, new Date().getTime())) {
        const newPaidToDate: Date = new Date(addMonthsToDate(latestPaidToTime, extendSubscriptionDto.subscriptionTimeMonths));
        const invoiceAmount: string = Number(BITTERY_SUBSCRIPTION_PRICE_USD * extendSubscriptionDto.subscriptionTimeMonths *
            getDiscountMultiplier(extendSubscriptionDto.subscriptionTimeMonths)).toFixed(2);
        const btcpayInvoice: BtcpayInvoice = await saveBitteryInvoice(userEmail,
            new SaveInvoiceDto(
                invoiceAmount,
                'USD',
                `Bittery LND ${extendSubscriptionDto.subscriptionTimeMonths} months plan`,
                userEmail));
        await runInTransaction((client) => {
            insertBilling(client, new Billing(
                generateUuid(),
                userEmail,
                Product.LND,
                btcpayInvoice.id,
                new Date().toISOString(),
                newPaidToDate.toISOString(),
                BillingStatus.PENDING,
            ));
        });
        logInfo(`Successfully created subscription billing for user ${userEmail} for ${extendSubscriptionDto.subscriptionTimeMonths} months`);
        return btcpayInvoice.id;
    } else {
        logError(`Cannot extend subscription for user ${userEmail} because current subscription is already expired.`);
        return undefined;
        // it means LND expired - was not paid in time
    }
};

export const getUserSubscription = async (userEmail: string): Promise<SubscriptionDto> => {
    const latestPaidUserBilling: Billing = (await findLatestCreatedBillingWithStatus(
        userEmail, Product.LND, BillingStatus.PAID))!;
    const hostedLndType: HostedLndType | undefined = await findUserHostedLndType(userEmail);
    if (hostedLndType) {
        const latestPaidToTime: number = new Date(latestPaidUserBilling.paidToDate).getTime();
        const subscriptionStatus: SubscriptionStatus = isFirstDateAfterSecond(latestPaidToTime, new Date().getTime()) ?
            SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED;
        return new SubscriptionDto(
            subscriptionStatus,
            new Date(latestPaidUserBilling.paidToDate).getTime(),
            getSubscriptionPlan(hostedLndType),
            BITTERY_SUBSCRIPTION_PRICE_USD.toFixed(2),
            [],
        );
    } else {
        return new SubscriptionDto(
            SubscriptionStatus.ACTIVE,
            0,
            SubscriptionPlan.FREE,
            '0',
            [],
        );
    }
};

export const getUserSubscriptionBillingInvoices = async (userEmail: string): Promise<BillingDto[]> => {
    const billingDtos: BillingDto[] = [];
    const userBillings: Billing[] = await findBillingsNewestFirst(userEmail);
    for (const billing of userBillings) {
        if (billing.invoiceId !== 'PAID_BY_BITTERY') {
            const bitteryInvoice: Invoice =  await getBitteryInvoice(userEmail, billing.invoiceId);
            billingDtos.push(new BillingDto(
                new Date(billing.creationDate).getTime(),
                bitteryInvoice.itemDesc!,
                billing.product,
                billing.invoiceId,
                new Date(billing.paidToDate).getTime(),
                billing.status,
                bitteryInvoice.btcPrice,
                bitteryInvoice.btcPaid,
                bitteryInvoice.currency,
                bitteryInvoice.price,
            ));
        }
    }
    return billingDtos;
};

const getSubscriptionPlan = (hostedLndType: HostedLndType): SubscriptionPlan => {
    switch (hostedLndType) {
        case HostedLndType.ENCRYPTED:
            return SubscriptionPlan.LN_NODE_ENCRYPTED;
        case HostedLndType.STANDARD:
            return SubscriptionPlan.LN_NODE_STANDARD;
    }
};

const getDiscountMultiplier = (months: number): number => {
    if (months === 3) {
        return 0.95;
    } else if (months > 3 && months < 12) {
        return 0.9;
    } else if (months === 12) {
        return 0.8;
    } else {
        return 1;
    }
};
