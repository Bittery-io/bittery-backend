import { Response } from 'express-serve-static-core';
import { Body, JsonController, Post, Res } from 'routing-controllers/index';
import { Param } from 'routing-controllers';
import { getProperty } from '../application/property-service';
import { logError, logInfo, logWarn } from '../application/logging-service';
import { Invoice } from 'btcpay';
import { findBilling, updateBilling } from '../domain/repository/lnd-billings-repository';
import { LndBilling } from '../domain/model/billings/lnd-billing';
import { BillingStatus } from '../domain/model/billings/billing-status';
import { findUserActiveLnd } from '../domain/repository/lnd/lnds-repository';
import { Lnd } from '../domain/model/lnd/lnd';
import { restoreLnd } from '../domain/services/lnd/restore-user-lnd-service';
import { subscripionRestoredEmail, subscriptionExtendedEmail } from '../application/mail-service';
import { addMonthsToDate } from '../domain/services/utils/date-service';

@JsonController('/btcpay')
export class AccountBtcpayWebhookController {

    // called by BtcPay
    @Post('/billing/invoice/:btcpayWebhookSecretKey/:invoiceOwnerEmailBase64')
    async processBillingInvoiceWebhook(
            @Param('btcpayWebhookSecretKey') btcpayWebhookSecretKey: string,
            @Param('invoiceOwnerEmailBase64') invoiceOwnerEmailBase64: string,
            @Res() res: Response,
            @Body({ required: false }) body: any) {
        const invoiceOwnerEmail: string = Buffer.from(invoiceOwnerEmailBase64, 'base64').toString();
        if (body.event) {
            const eventName: string = body.event!.name;
            const btcpayInvoice: Invoice = body.data;
            if (btcpayWebhookSecretKey === getProperty('BTCPAY_WEBHOOK_SECRET_KEY')) {
                const billing: LndBilling | undefined = await findBilling(invoiceOwnerEmail, btcpayInvoice.id);
                if (billing) {
                    switch (eventName) {
                        // case 'invoice_expired':
                        //     billing.status = BillingStatus.EXPIRED;
                        //     await updateBilling(billing);
                        //     logInfo(`Successfully updated Bitte
                        //     ry subscription invoice as EXPIRED for invoice with id ${btcpayInvoice.id} and user email ${invoiceOwnerEmail}`);
                        //     break;
                        // case 'invoice_complete':
                        // todo tylko dla testow zamienione!!!!
                        case 'invoice_expired':
                            const lnd: Lnd | undefined = await findUserActiveLnd(invoiceOwnerEmail);
                            if (!lnd) {
                                // must restore!
                                // billing has lndIf of latest active lnd so it is the one to restore
                                await restoreLnd(invoiceOwnerEmail, billing.lndId);
                            }
                            billing.status = BillingStatus.PAID;
                            const newPaidToDate: Date = new Date(addMonthsToDate(new Date().getTime(), billing.subscriptionMonths));
                            billing.paidToDate = newPaidToDate.toISOString();
                            await updateBilling(billing);
                            if (lnd) {
                                await subscriptionExtendedEmail(invoiceOwnerEmail, 1);
                            } else {
                                await subscripionRestoredEmail(invoiceOwnerEmail, 1);
                            }
                            logInfo(`Successfully updated Bittery subscription invoice as PAID for invoice with id ${btcpayInvoice.id} and user email ${invoiceOwnerEmail}`);
                    }
                }
            } else {
                logError(`Billing Btcpay webhook processing security fail: given webhook key ${btcpayWebhookSecretKey} is not matching expected!`);
                return res.sendStatus(500);
            }
        } else {
            logWarn('Got unwanted btcpay notification, skip');
        }
        return res.sendStatus(200);
    }

}
