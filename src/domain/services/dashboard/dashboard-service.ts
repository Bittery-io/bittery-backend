import { DashboardTimeframeType } from '../../model/dashboard/dashboard-timeframe-type';
import { getBtcpayInvoicesBetweenDate } from '../btcpay/btcpay-client-service';
import {
    getEpochLastSecondOfToday,
    minusDays,
    minusDaysGetDay,
    minusDaysGetMonth,
    nowepoch,
} from '../utils/date-service';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { findUserBtcpayDetails } from '../../repository/user-btcpay-details-repository';
import { UserBtcpayException } from '../btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../btcpay/user-btcpay-error-type';
import { Invoice } from 'btcpay';
import { DashboardInfoDto } from '../../../interfaces/dto/dashboard/dashboard-info-dto';
import { logError } from '../../../application/logging-service';

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
        const invoices: Invoice[] = await getBtcpayInvoicesBetweenDate(
            userBtcpayDetails.btcpayUserAuthToken, beforeDateString, nowDateString);
        return mapInvoicesToDashboardInvoiceDto(invoices, dashboardTimeframeType);
    } else {
        throw new UserBtcpayException(`Cannot get dashboard info because user ${userEmail} has not btcpay yet!`,
            UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

const mapInvoicesToDashboardInvoiceDto = (invoices: Invoice[],
                                          dashboardTimeframeType: DashboardTimeframeType): DashboardInfoDto => {
    const invoicesQuantity: number =  invoices.length;
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
                const timeFrameInvoices: Invoice[] = invoices.filter(
                    invoice => invoice.invoiceTime < timeUpFrame && invoice.invoiceTime > timeDownFrame);
                let paidAmount: number = 0;

                let newInvoicesTimeframeQuantity: number = 0;
                let paidInvoicesTimeframeQuantity: number = 0;
                let expiredInvoicesTimeframeQuantity: number = 0;
                timeFrameInvoices.forEach((invoice) => {
                    paidAmount += Number(invoice.btcPaid);
                    switch (invoice.status) {
                        case 'new':
                            newInvoicesTimeframeQuantity += 1;
                            break;
                        case 'complete':
                        case 'paid':
                        case 'confirmed':
                            paidInvoicesTimeframeQuantity += 1;
                            break;
                        case 'expired':
                            expiredInvoicesTimeframeQuantity += 1;
                            break;
                        default:
                            logError(`Dashboard unexpected invoice status: ${invoice.status}. DID not count to anything.`);
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
        totalReceivedPaymentsBtc += Number(invoice.btcPaid);
        totalInvoicedAmountBtc += Number(invoice.btcPrice);
        switch (invoice.status) {
            case 'new':
                newInvoicedAmountBtc += Number(invoice.btcPrice);
                newInvoicesQuantity += 1;
                break;
            case 'complete':
                paidInvoicedAmountBtc += Number(invoice.btcPrice);
                paidInvoicesQuantity += 1;
                break;
            case 'expired':
                expiredInvoicedAmountBtc += Number(invoice.btcPrice);
                expiredInvoicesQuantity += 1;
                break;
            default:
                logError(`Dashboard unexpected invoice status: ${invoice.status}. DID not count to anything.`);
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
    );
};
