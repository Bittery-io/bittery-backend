import { logInfo } from '../../../application/logging-service';
import { addHoursGetDate, formatDateWithTime } from '../utils/date-service';
import { LndBilling } from '../../model/billings/lnd-billing';
import { findBillingsWithStatus, updateBilling } from '../../repository/lnd-billings-repository';
import { BillingStatus } from '../../model/billings/billing-status';
import { getBitteryInvoice } from '../payments/bittery-invoice-service';
import { BtcpayInvoice } from '../../model/btcpay/invoices/btcpay-invoice';
import { InvoiceStatus } from 'btcpay-greenfield-node-client';

const schedule = require('node-schedule');
let nextSchedulerDateEpoch: number;

export const startBillingsUpdateScheduler = () => {
    logInfo('Setting up BITTERY billings check every 12h scheduler');
    // every 12 hours
    // schedule.scheduleJob('0 */12 * * *', async () => {
    schedule.scheduleJob('* * * * *', async () => {
        logInfo(`[Billings scheduler] 1/3 Starting subscription billings checker scheduler at ${formatDateWithTime(new Date().getTime())}`);
        nextSchedulerDateEpoch = addHoursGetDate(new Date().getTime(), 12);
        const pendingBillings: LndBilling[] = await findBillingsWithStatus(BillingStatus.PENDING);
        logInfo(`[Billings scheduler] 2/3 Found all pending billings in db: ${pendingBillings.length}`);
        pendingBillings.map(async (_) => {
            const invoice: BtcpayInvoice = await getBitteryInvoice(_.invoiceId);
            if (invoice.invoiceData.status! === InvoiceStatus.SETTLED) {
                _.status = BillingStatus.PAID;
                await updateBilling(_);
                logInfo(`[Billings scheduler] 2.1/3 Invoice with id ${invoice.invoiceData.id} is updated as PAID!`);
            } else if (invoice.invoiceData.status! === InvoiceStatus.EXPIRED) {
                _.status = BillingStatus.EXPIRED;
                logInfo(`[Billings scheduler] 2.1/3 Invoice with id ${invoice.invoiceData.id} is updated as EXPIRED!`);
                await updateBilling(_);
            }
        });
    });
};
