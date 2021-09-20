import { DashboardTimeframeType } from '../../model/dashboard/dashboard-timeframe-type';
import { getEpochLastSecondOfToday, minusDays, minusDaysGetDay, minusDaysGetMonth, } from '../utils/date-service';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { findUserBtcpayDetails } from '../../repository/user-btcpay-details-repository';
import { UserBtcpayException } from '../btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../btcpay/user-btcpay-error-type';
import { DashboardInfoDto } from '../../../interfaces/dto/dashboard/dashboard-info-dto';
import { logError } from '../../../application/logging-service';
import { BTC_PAYMENTS_DONE_TYPE, getBtcpayInvoices, LN_PAYMENTS_DONE_TYPE } from '../btcpay/btcpay-client-service';
import { BtcpayInvoice } from '../../model/btcpay/invoices/btcpay-invoice';
import { InvoiceStatus } from 'btcpay-greenfield-node-client';

export const getDashboardInfo = async (userEmail: string, dashboardTimeframeType: DashboardTimeframeType):
        Promise<DashboardInfoDto> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const nowDate: Date = new Date();
        const nowDateString: string = nowDate.toISOString();
        let beforeDateString: string;
        switch (dashboardTimeframeType) {
            case DashboardTimeframeType.LAST_30_DAYS:
                beforeDateString = new Date(minusDays(nowDate.getTime(), 30)).toISOString();
                break;
        }
        const invoices: BtcpayInvoice[] = await getBtcpayInvoices(userBtcpayDetails, []);
        return mapInvoicesToDashboardInvoiceDto(invoices, dashboardTimeframeType);
    } else {
        throw new UserBtcpayException(`Cannot get dashboard info because user ${userEmail} has not btcpay yet!`,
            UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

const mapInvoicesToDashboardInvoiceDto = (invoices: BtcpayInvoice[],
                                          dashboardTimeframeType: DashboardTimeframeType): DashboardInfoDto => {
    const invoicesQuantity: number =  invoices.length;
    let totalReceivedViaTransactions: number = 0;
    let totalReceivedViaLightning: number = 0;
    let totalReceivedPaymentsBtc: number = 0;
    let totalInvoicedAmountBtc: number = 0;
    let newInvoicedAmountBtc: number = 0;
    let paidInvoicedAmountBtc: number = 0;
    let expiredInvoicedAmountBtc: number = 0;
    let newInvoicesQuantity: number = 0;
    let paidInvoicesQuantity: number = 0;
    let expiredInvoicesQuantity: number = 0;
    const timeframes: string [] = [];
    const paidInvoicesAmountTimeframesValues: number[] = [];
    const paidInvoicesQuantityTimeframesValues: number[] = [];
    const newInvoicesQuantityTimeframesValues: number[] = [];
    const expiredInvoicesQuantityTimeframesValues: number[] = [];

    const nowTime: number = new Date().getTime();
    // it is because there are duplicates in cryptoInfo.payments for BTCLike and LightningLike
    const paymentsDoneSet = new Set();
    switch (dashboardTimeframeType) {
        case DashboardTimeframeType.LAST_30_DAYS:
            let timeUpFrame: number = getEpochLastSecondOfToday();
            let timeDownFrame: number = minusDays(timeUpFrame, 1);
            for (let i = 0; i < 30; i++) {
                const day: number = minusDaysGetDay(nowTime, i);
                const month: number = minusDaysGetMonth(nowTime, i);
                timeframes.push(`Day: ${day}.${month}`);
                // Work on 1day window, skip on first loop because already set
                if (i > 0) {
                    timeUpFrame = timeDownFrame;
                    timeDownFrame = minusDays(timeUpFrame, 1);
                }
                const timeFrameInvoices: BtcpayInvoice[] = invoices.filter(
                    invoice => invoice.invoiceData.createdTime! < timeUpFrame && invoice.invoiceData.createdTime! > timeDownFrame);
                let paidAmount: number = 0;

                let newInvoicesTimeframeQuantity: number = 0;
                let paidInvoicesTimeframeQuantity: number = 0;
                let expiredInvoicesTimeframeQuantity: number = 0;
                timeFrameInvoices.forEach((invoice) => {
                    paidAmount += Number(invoice.invoicePayments[0].totalPaid!);
                    switch (invoice.invoiceData.status!) {
                        case InvoiceStatus.NEW:
                            newInvoicesTimeframeQuantity += 1;
                            break;
                        case InvoiceStatus.SETTLED:
                            paidInvoicesTimeframeQuantity += 1;
                            break;
                        case InvoiceStatus.EXPIRED:
                            expiredInvoicesTimeframeQuantity += 1;
                            break;
                        default:
                            logError(`Dashboard unexpected invoice status: ${invoice.invoiceData.status!}. DID not count to anything.`);
                    }
                });
                paidInvoicesAmountTimeframesValues.push(paidAmount);
                newInvoicesQuantityTimeframesValues.push(newInvoicesTimeframeQuantity);
                paidInvoicesQuantityTimeframesValues.push(paidInvoicesTimeframeQuantity);
                expiredInvoicesQuantityTimeframesValues.push(expiredInvoicesTimeframeQuantity);
            }
            timeframes.reverse();
            paidInvoicesAmountTimeframesValues.reverse();
            newInvoicesQuantityTimeframesValues.reverse();
            paidInvoicesQuantityTimeframesValues.reverse();
            expiredInvoicesQuantityTimeframesValues.reverse();
            break;
    }
    invoices.forEach((invoice) => {
        invoice.invoicePayments.forEach((_) => {
            // unfortunatelly adding objects is making duplicates
            paymentsDoneSet.add(JSON.stringify({
                id: invoice.invoiceData.id,
                value: _.paymentMethodPaid!,
                type: _.paymentMethod,
            }));
        });
        totalReceivedPaymentsBtc += Number(invoice.invoicePayments[0].totalPaid);
        //todo lepiej to sprawdz bo to samo co wyzej
        totalInvoicedAmountBtc += Number(invoice.invoicePayments[0].totalPaid);
        switch (invoice.invoiceData.status) {
            case InvoiceStatus.NEW:
                newInvoicedAmountBtc += Number(invoice.invoicePayments[0].amount);
                newInvoicesQuantity += 1;
                break;
            case InvoiceStatus.SETTLED:
                paidInvoicedAmountBtc += Number(invoice.invoicePayments[0].amount);
                paidInvoicesQuantity += 1;
                break;
            case InvoiceStatus.EXPIRED:
                expiredInvoicedAmountBtc += Number(invoice.invoicePayments[0].amount);
                expiredInvoicesQuantity += 1;
                break;
            default:
                logError(`Dashboard unexpected invoice status: ${invoice.invoiceData.status}. DID not count to anything.`);
        }
    });
    Array.from(paymentsDoneSet).forEach((paymentInfo: any) => {
        const info: any = JSON.parse(paymentInfo);
        if (info.type === LN_PAYMENTS_DONE_TYPE) {
            totalReceivedViaLightning += Number(info.value);
        } else if (info.type === BTC_PAYMENTS_DONE_TYPE) {
            totalReceivedViaTransactions += Number(info.value);
        }
    });
    return new DashboardInfoDto(
        totalReceivedPaymentsBtc,
        totalInvoicedAmountBtc,
        newInvoicedAmountBtc,
        paidInvoicedAmountBtc,
        expiredInvoicedAmountBtc,
        invoicesQuantity,
        newInvoicesQuantity,
        paidInvoicesQuantity,
        expiredInvoicesQuantity,
        timeframes,
        paidInvoicesAmountTimeframesValues,
        newInvoicesQuantityTimeframesValues,
        paidInvoicesQuantityTimeframesValues,
        expiredInvoicesQuantityTimeframesValues,
        invoices,
        totalReceivedViaLightning.toFixed(8),
        totalReceivedViaTransactions.toFixed(8),
    );
};
