import { Response, Request } from 'express-serve-static-core';
import { HeaderParam, JsonController, Post, Req, Res, UseBefore } from 'routing-controllers';
import { logError, logInfo, logWarn } from '../application/logging-service';
import {
    findBilling,
    findLatestCreatedBillingWithStatus,
    updateBilling,
} from '../domain/repository/lnd-billings-repository';
import { LndBilling } from '../domain/model/billings/lnd-billing';
import { BillingStatus } from '../domain/model/billings/billing-status';
import { findUserActiveLnd } from '../domain/repository/lnd/lnds-repository';
import { Lnd } from '../domain/model/lnd/lnd';
import { restoreLnd } from '../domain/services/lnd/restore-user-lnd-service';
import {
    sendErrorOccurredEmailToAdmin,
    subscripionRestoredEmail,
    subscriptionExtendedEmail
} from '../application/mail-service';
import { addMonthsToDate, isFirstDateAfterSecond } from '../domain/services/utils/date-service';
import { BtcpayInvoice } from '../domain/model/btcpay/invoices/btcpay-invoice';
import { WebhookInvoiceEvent } from 'btcpay-greenfield-node-client/src/models/WebhookInvoiceEvent';
import { getBtcpayInvoice } from '../domain/services/btcpay/btcpay-client-service';
import { BITTERY_USER_BTCPAY_DETAILS } from '../domain/services/payments/bittery-invoice-service';
import { getProperty } from '../application/property-service';
var crypto = require('crypto');

// RawBodyMiddleware.ts

const RawBodyMiddleware = (req: Request, res: Response, next: () => void) => {
    const body = []
    // @ts-ignore
    req.on('data', chunk => {
        // @ts-ignore
        body.push(chunk)
    })
    // @ts-ignore
    req.on('end', () => {
        const rawBody = Buffer.concat(body)
        req['rawBody'] = rawBody
    // @ts-ignore
        switch (req.header('content-type')) {
            case 'application/json':
                // @ts-ignore
                req.body = JSON.parse(rawBody.toString())
                break
            // add more body parsing if needs be
            default:
        }
        next();
    })
    // @ts-ignore
    req.on('error', () => {
        res.sendStatus(400)
    })
}

@JsonController('/btcpay')
@UseBefore(RawBodyMiddleware)
export class AccountBtcpayWebhookController {

    // called by BtcPay
    @Post('/billing/invoice')
    async processBillingInvoiceWebhook(
            @HeaderParam('BTCPay-Sig') btcpaySig: string,
            @Res() res: Response,
            @Req() req: Request) {
        try {
            // @ts-ignore
            const expected = 'sha256=' + crypto.createHmac('sha256', getProperty('BTCPAY_FACADE_WEBHOOK_SECRET')).update(req.rawBody).digest("hex");
            if (btcpaySig !== expected) {
                logError(`Received BTCPAY webhook has incorrect HMAC!!! Got: ${btcpaySig}, expected: ${expected}`);
                return res.sendStatus(400);
            }
            // @ts-ignore
            const webhookInvoiceEvent: WebhookInvoiceEvent = JSON.parse(req.rawBody);
            logInfo('Wohoo BTCPAY webhook with type: ' + webhookInvoiceEvent.type);
            const invoiceId: string = webhookInvoiceEvent.invoiceId!;
            const btcpayInvoice: BtcpayInvoice = await getBtcpayInvoice(BITTERY_USER_BTCPAY_DETAILS, invoiceId);
            const invoiceOwnerEmail: string = btcpayInvoice.invoiceData.metadata.buyerName;
            const billing: LndBilling | undefined = await findBilling(
                btcpayInvoice.invoiceData.metadata.buyerName,
                btcpayInvoice.invoiceData.id!);
            if (billing) {
                // options:
                // InvoiceCreated
                // InvoiceReceivedPayment
                // InvoicePaidInFull
                // InvoiceExpired
                // InvoiceConfirmed
                // InvoiceInvalid
                // todo I miss in docs InvoiceSettled which is actually the one I expect
                switch (webhookInvoiceEvent.type) {
                    case 'InvoiceExpired':
                        billing.status = BillingStatus.EXPIRED;
                        await updateBilling(billing);
                        logInfo(`Successfully updated Bittery subscription invoice as EXPIRED for invoice with id ${invoiceId} and user email ${invoiceOwnerEmail}`);
                        break;
                    case 'InvoiceSettled':
                        // NO AWAIT IS INTENTIONAL - it took too much time to process
                        this.restoreLnd(invoiceOwnerEmail, billing, invoiceId);
                        break;
                    default:
                        logWarn(`Skipping BTCPAY webhook of type: ${webhookInvoiceEvent.type}`);
                        break;
                }
            }
        } catch (err) {
            logError(`Got BTCPAY webhook error which was handled to not block: ${err.message}`)
            return res.sendStatus(400);
        }
        return res.sendStatus(200);
    }

    async restoreLnd(invoiceOwnerEmail: string, billing: LndBilling, invoiceId: string): Promise<void> {
        try {
            const lnd: Lnd | undefined = await findUserActiveLnd(invoiceOwnerEmail);
            let lndIfToSetInNewUpdatedBilling: string | undefined = lnd?.lndId;
            if (!lnd) {
                // must restore!
                // billing has lndIf of latest active lnd so it is the one to restore
                lndIfToSetInNewUpdatedBilling = await restoreLnd(invoiceOwnerEmail, billing.lndId);
            }
            // Paid to date must take into consideration already paid invoices
            // Because user can still have valid account when he pays for new invoice
            // In that case it must extend the subscription for already valid days + new days
            let newPaidToDate: Date | undefined;
            const latestPaidBilling: LndBilling | undefined =
                await findLatestCreatedBillingWithStatus(invoiceOwnerEmail, BillingStatus.PAID);
            if (latestPaidBilling) {
                const latestBillingPaidToDate: string | undefined = latestPaidBilling.paidToDate;
                if (latestBillingPaidToDate) {
                    const latestBillingPaidToDateTimestamp: number = new Date(latestBillingPaidToDate).getTime();
                    const isLatestBillingPaidToDateInFuture: boolean =
                        isFirstDateAfterSecond(latestBillingPaidToDateTimestamp, new Date().getTime());
                    if (isLatestBillingPaidToDateInFuture) {
                        newPaidToDate = new Date(addMonthsToDate(latestBillingPaidToDateTimestamp, billing.subscriptionMonths));
                    }
                }
            }
            if (!newPaidToDate) {
                newPaidToDate = new Date(addMonthsToDate(new Date().getTime(), billing.subscriptionMonths));
            }
            billing.status = BillingStatus.PAID;
            billing.paidToDate = newPaidToDate.toISOString();
            // Here it's wired a little bit but I must update this paid billing as being paid for new LND because it
            // has old LND id
            billing.lndId = lndIfToSetInNewUpdatedBilling!;
            //todo przywroc jeszcze raz i zanim przywrocisz to sprawdz czy jak wlaczysz i nie obdlokuesjz to zrobis ie static channel backup
            await updateBilling(billing);
            if (lnd) {
                await subscriptionExtendedEmail(invoiceOwnerEmail, billing.subscriptionMonths, newPaidToDate.getTime());
            } else {
                await subscripionRestoredEmail(invoiceOwnerEmail, billing.subscriptionMonths, newPaidToDate.getTime());
            }
            logInfo(`Successfully updated Bittery subscription invoice as PAID for invoice with id ${invoiceId} and user email ${invoiceOwnerEmail}`);
        } catch (err) {
            sendErrorOccurredEmailToAdmin(`Error occurred during restoring LND for user email ${invoiceOwnerEmail}. Ex: ${err.message}`);
        }
    }

}
