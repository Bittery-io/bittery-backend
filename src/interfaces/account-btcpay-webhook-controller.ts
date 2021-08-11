import { Response, Request } from 'express-serve-static-core';
import { HeaderParam, JsonController, Post, Req, Res, UseBefore } from 'routing-controllers';
import { Param } from 'routing-controllers';
import { getProperty } from '../application/property-service';
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
import { subscripionRestoredEmail, subscriptionExtendedEmail } from '../application/mail-service';
import { addMonthsToDate, isFirstDateAfterSecond } from '../domain/services/utils/date-service';
import { BtcpayInvoice } from '../domain/model/btcpay/invoices/btcpay-invoice';
import { WebhookInvoiceEvent } from 'btcpay-greenfield-node-client/src/models/WebhookInvoiceEvent';
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
        // @ts-ignore
        const expected = 'sha256=' + crypto.createHmac('sha256', "KNrkuos2YTsik8GgxU83cX").update(req.rawBody).digest("hex");
        if (btcpaySig !== expected) {
            logError(`Received BTCPAY webhook has incorrect HMAC!!! Got: ${btcpaySig}, expected: ${expected}`);
            return res.sendStatus(400);
        }
        // @ts-ignore
        const webhookInvoiceEvent: WebhookInvoiceEvent = JSON.parse(req.rawBody);
        console.log('Wohoo webhook ' + webhookInvoiceEvent.type);
        // const billing: LndBilling | undefined = await findBilling(invoiceOwnerEmail, btcpayInvoice.invoiceData.id!);
        // if (billing) {
        //     switch (eventName) {
        //         // case 'invoice_expired':
        //         //     billing.status = BillingStatus.EXPIRED;
        //         //     await updateBilling(billing);
        //         //     logInfo(`Successfully updated Bitte
        //         //     ry subscription invoice as EXPIRED for invoice with id ${btcpayInvoice.id} and user email ${invoiceOwnerEmail}`);
        //         //     break;
        //         // case 'invoice_complete':
        //         // todo tylko dla testow zamienione!!!!
        //         case 'invoice_expired':
        //             const lnd: Lnd | undefined = await findUserActiveLnd(invoiceOwnerEmail);
        //             if (!lnd) {
        //                 // must restore!
        //                 // billing has lndIf of latest active lnd so it is the one to restore
        //                 await restoreLnd(invoiceOwnerEmail, billing.lndId);
        //             }
        //             // Paid to date must take into consideration already paid invoices
        //             // Because user can still have valid account when he pays for new invoice
        //             // In that case it must extend the subscription for already valid days + new days
        //             let newPaidToDate: Date | undefined;
        //             const latestPaidBilling: LndBilling | undefined =
        //                 await findLatestCreatedBillingWithStatus(invoiceOwnerEmail, BillingStatus.PAID);
        //             if (latestPaidBilling) {
        //                 const latestBillingPaidToDate: string | undefined = latestPaidBilling.paidToDate;
        //                 if (latestBillingPaidToDate) {
        //                     const latestBillingPaidToDateTimestamp: number = new Date(latestBillingPaidToDate).getTime();
        //                     const isLatestBillingPaidToDateInFuture: boolean =
        //                         isFirstDateAfterSecond(latestBillingPaidToDateTimestamp, new Date().getTime());
        //                     if (isLatestBillingPaidToDateInFuture) {
        //                         newPaidToDate = new Date(addMonthsToDate(latestBillingPaidToDateTimestamp, billing.subscriptionMonths));
        //                     }
        //                 }
        //             }
        //             if (!newPaidToDate) {
        //                 newPaidToDate = new Date(addMonthsToDate(new Date().getTime(), billing.subscriptionMonths));
        //             }
        //
        //             billing.status = BillingStatus.PAID;
        //             billing.paidToDate = newPaidToDate.toISOString();
        //             await updateBilling(billing);
        //             if (lnd) {
        //                 await subscriptionExtendedEmail(invoiceOwnerEmail, billing.subscriptionMonths, newPaidToDate.getTime());
        //             } else {
        //                 await subscripionRestoredEmail(invoiceOwnerEmail, billing.subscriptionMonths, newPaidToDate.getTime());
        //             }
        //             logInfo(`Successfully updated Bittery subscription invoice as PAID for invoice with id ${btcpayInvoice.invoiceData.id} and user email ${invoiceOwnerEmail}`);
        //     }
        // }
        return res.sendStatus(200);
    }

}
