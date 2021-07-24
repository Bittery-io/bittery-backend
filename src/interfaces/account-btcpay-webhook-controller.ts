import { Response } from 'express-serve-static-core';
import { Body, JsonController, Post, Res } from 'routing-controllers/index';
import { Param } from 'routing-controllers';
import { getProperty } from '../application/property-service';
import { logError, logInfo, logWarn } from '../application/logging-service';
import { Invoice } from 'btcpay';
import { findBilling, updateBilling } from '../domain/repository/lnd-billings-repository';
import { LndBilling } from '../domain/model/billings/lnd-billing';
import { BillingStatus } from '../domain/model/billings/billing-status';

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
                        case 'invoice_expired':
                            billing.status = BillingStatus.EXPIRED;
                            await updateBilling(billing);
                            logInfo(`Successfully updated Bittery subscription invoice as EXPIRED for invoice with id ${btcpayInvoice.id} and user email ${invoiceOwnerEmail}`);
                            break;
                        case 'invoice_complete':
                            billing.status = BillingStatus.PAID;
                            await updateBilling(billing);
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
