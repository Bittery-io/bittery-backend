import {
    findBillingsNewestFirst,
    findLatestCreatedBillingWithStatus,
    insertBilling,
    updateAllBillingsWithGivenStatusSetNewStatus,
} from '../../repository/lnd-billings-repository';
import { Product } from '../../model/billings/product';
import { LndBilling } from '../../model/billings/lnd-billing';
import { BillingStatus } from '../../model/billings/billing-status';
import { addMonthsToDate, isFirstDateAfterSecond } from '../utils/date-service';
import { BtcpayInvoice } from '../../model/btcpay/btcpay-invoice';
import { getBitteryInvoice, saveBitteryInvoice } from '../payments/bittery-invoice-service';
import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { runInTransaction } from '../../../application/db/db-transaction';
import { generateUuid } from '../utils/id-generator-service';
import { logError, logInfo } from '../../../application/logging-service';
import { SubscriptionDto } from '../../../interfaces/dto/account/subscription-dto';
import { findUserHostedLnds } from '../../repository/lnd/lnd-hosted-repository';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { ExtendSubscriptionDto } from '../../../interfaces/dto/account/extend-subscription-dto';
import { BillingDto } from '../../../interfaces/dto/account/billing-dto';
import { Invoice } from 'btcpay';
import { getNumberProperty } from '../../../application/property-service';
import { HostedLnd } from '../../model/lnd/hosted/hosted-lnd';
import { SubscriptionStatus } from '../../model/subscription/subscription-status';
import { SubscriptionPlan } from '../../model/subscription/subscription-plan';
import { InvoiceValidityType } from '../../model/payments/invoice-validity-type';

const BITTERY_SUBSCRIPTION_PRICE_USD = getNumberProperty('LND_SUBSCRIPTION_PRICE_USD');

export const extendSubscription = async (userEmail: string, extendSubscriptionDto: ExtendSubscriptionDto): Promise<string | undefined> => {
    const latestPaidUserBilling: LndBilling = (await findLatestCreatedBillingWithStatus(userEmail, BillingStatus.PAID))!;
    const invoiceAmount: string = Number(BITTERY_SUBSCRIPTION_PRICE_USD * extendSubscriptionDto.subscriptionTimeMonths *
        getDiscountMultiplier(extendSubscriptionDto.subscriptionTimeMonths)).toFixed(2);
    const btcpayInvoice: BtcpayInvoice = await saveBitteryInvoice(userEmail,
        new SaveInvoiceDto(
            invoiceAmount,
            'USD',
            InvoiceValidityType.THREE_DAYS,
            `Bittery LND ${extendSubscriptionDto.subscriptionTimeMonths} months plan`,
            userEmail));
    await runInTransaction((client) => {
        updateAllBillingsWithGivenStatusSetNewStatus(client, userEmail, BillingStatus.PENDING, BillingStatus.REPLACED_BY_NEWER);
        insertBilling(client, new LndBilling(
            generateUuid(),
            userEmail,
            latestPaidUserBilling.lndId,
            btcpayInvoice.id,
            new Date().toISOString(),
            BillingStatus.PENDING,
            extendSubscriptionDto.subscriptionTimeMonths,
            undefined,
        ));
    });
    logInfo(`Successfully created subscription billing for user ${userEmail} for ${extendSubscriptionDto.subscriptionTimeMonths} months`);
    return btcpayInvoice.id;
};

export const getUserSubscription = async (userEmail: string): Promise<SubscriptionDto> => {
    const hostedLnds: HostedLnd[] = await findUserHostedLnds(userEmail);
    if (hostedLnds.length > 0) {
        // todo currently only for single LND per user
        const hostedLnd: HostedLnd = hostedLnds[0];
        const latestPaidUserBilling: LndBilling = (await findLatestCreatedBillingWithStatus(userEmail, BillingStatus.PAID))!;
        const latestPaidToTime: number = new Date(latestPaidUserBilling.paidToDate!).getTime();
        const subscriptionStatus: SubscriptionStatus = isFirstDateAfterSecond(latestPaidToTime, new Date().getTime()) ?
            SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED;
        return new SubscriptionDto(
            subscriptionStatus,
            new Date(latestPaidUserBilling.paidToDate!).getTime(),
            getSubscriptionPlan(hostedLnd.hostedLndType),
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
    const userBillings: LndBilling[] = await findBillingsNewestFirst(userEmail);
    for (const billing of userBillings) {
        if (billing.invoiceId !== 'PAID_BY_BITTERY') {
            const bitteryInvoice: Invoice =  await getBitteryInvoice(billing.invoiceId);
            billingDtos.push(new BillingDto(
                new Date(billing.creationDate).getTime(),
                bitteryInvoice.itemDesc!,
                Product.LND,
                billing.invoiceId,
                new Date(billing.paidToDate!).getTime(),
                billing.status,
                bitteryInvoice.btcPrice,
                bitteryInvoice.btcPaid,
                bitteryInvoice.currency,
                bitteryInvoice.price,
                billing.lndId,
            ));
        }
    }
    return billingDtos;
};

const getSubscriptionPlan = (hostedLndType: HostedLndType): SubscriptionPlan => {
    switch (hostedLndType) {
        case HostedLndType.ENCRYPTED:
            return SubscriptionPlan.BITTERY_ENCRYPTED;
        case HostedLndType.STANDARD:
            return SubscriptionPlan.BITTERY_STANDARD;
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
