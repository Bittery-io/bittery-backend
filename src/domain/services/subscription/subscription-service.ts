import {
    findBillingsNewestFirst,
    findLatestCreatedBillingWithStatus,
    insertBilling,
    updateAllBillingsWithGivenStatusSetNewStatus,
} from '../../repository/lnd-billings-repository';
import { Product } from '../../model/billings/product';
import { LndBilling } from '../../model/billings/lnd-billing';
import { BillingStatus } from '../../model/billings/billing-status';
import { isFirstDateAfterSecond } from '../utils/date-service';
import { getBitteryInvoice, saveBitteryInvoice } from '../payments/bittery-invoice-service';
import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { runInTransaction } from '../../../application/db/db-transaction';
import { generateUuid } from '../utils/id-generator-service';
import { logInfo } from '../../../application/logging-service';
import { SubscriptionDto } from '../../../interfaces/dto/account/subscription-dto';
import { findUserHostedLnds } from '../../repository/lnd/lnd-hosted-repository';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { ExtendSubscriptionDto } from '../../../interfaces/dto/account/extend-subscription-dto';
import { BillingDto } from '../../../interfaces/dto/account/billing-dto';
import { getNumberProperty } from '../../../application/property-service';
import { HostedLnd } from '../../model/lnd/hosted/hosted-lnd';
import { SubscriptionStatus } from '../../model/subscription/subscription-status';
import { SubscriptionPlan } from '../../model/subscription/subscription-plan';
import { InvoiceValidityType } from '../../model/payments/invoice-validity-type';
import { BtcpayInvoice } from '../../model/btcpay/invoices/btcpay-invoice';
import { InvoiceData } from 'btcpay-greenfield-node-client';
import { isDevelopment } from '../../../application/property-utils-service';

const BITTERY_SUBSCRIPTION_PRICE_USD = getNumberProperty('LND_SUBSCRIPTION_PRICE_USD');

export const extendSubscription = async (userEmail: string, extendSubscriptionDto: ExtendSubscriptionDto): Promise<string | undefined> => {
    const latestPaidUserBilling: LndBilling = (await findLatestCreatedBillingWithStatus(userEmail, BillingStatus.PAID))!;
    const invoiceAmount: string = Number(BITTERY_SUBSCRIPTION_PRICE_USD * extendSubscriptionDto.subscriptionTimeMonths *
        getDiscountMultiplier(extendSubscriptionDto.subscriptionTimeMonths)).toFixed(2);
    const invoiceData: InvoiceData = await saveBitteryInvoice(userEmail,
        new SaveInvoiceDto(
            isDevelopment() ? '0.01' : invoiceAmount,
            'USD',
            InvoiceValidityType.THREE_DAYS,
            `Bittery pro subscription ${extendSubscriptionDto.subscriptionTimeMonths} months plan`,
            // MUST BE EMAIL HERE OTHERWISE WEBHOOK MECHANISM WILL BREAK!!!!!!!
            userEmail));
    await runInTransaction((client) => {
        updateAllBillingsWithGivenStatusSetNewStatus(client, userEmail, BillingStatus.PENDING, BillingStatus.REPLACED_BY_NEWER);
        insertBilling(client, new LndBilling(
            generateUuid(),
            userEmail,
            latestPaidUserBilling.lndId,
            invoiceData.id!,
            new Date().toISOString(),
            BillingStatus.PENDING,
            extendSubscriptionDto.subscriptionTimeMonths,
            undefined,
        ));
    });
    logInfo(`Successfully created subscription billing for user ${userEmail} for ${extendSubscriptionDto.subscriptionTimeMonths} months`);
    return invoiceData.id;
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
            const bitteryInvoice: BtcpayInvoice =  await getBitteryInvoice(billing.invoiceId);
            billingDtos.push(new BillingDto(
                new Date(billing.creationDate).getTime(),
                Product.LND,
                billing.invoiceId,
                new Date(billing.paidToDate!).getTime(),
                billing.status,
                billing.lndId,
                bitteryInvoice,
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
