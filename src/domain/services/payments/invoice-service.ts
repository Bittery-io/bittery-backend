import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { findUserBtcpayDetails } from '../../repository/user-btcpay-details-repository';
import { createBtcpayInvoice, getBtcpayInvoice, getBtcpayInvoices } from '../btcpay/btcpay-client-service';
import { UserBtcpayException } from '../btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../btcpay/user-btcpay-error-type';
import { BtcpayInvoice } from '../../model/btcpay/btcpay-invoice';
import { generateInvoicePdf } from '../pdf/invoice-pdf-generator-service';
import { Invoice } from 'btcpay';
import { logInfo } from '../../../application/logging-service';
import { findUserActiveLnd } from '../../repository/lnd/lnds-repository';
import { Lnd } from '../../model/lnd/lnd';
import { lndGetInfo } from '../lnd/api/lnd-api-service';
import { LndInfo } from '../../model/lnd/api/lnd-info';

export const saveInvoice = async (userEmail: string, saveInvoiceDto: SaveInvoiceDto): Promise<void> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const btcpayInvoice: BtcpayInvoice = await createBtcpayInvoice(saveInvoiceDto, userBtcpayDetails.btcpayUserAuthToken!);
        logInfo(`Created new invoice with id ${btcpayInvoice.id} for user email ${userEmail}`);
    } else {
        throw new UserBtcpayException(`Cannot create invoice because user ${userEmail} has not btcpay yet!`, UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoices = async (userEmail: string, limit: number): Promise<Invoice[]> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        return await getBtcpayInvoices(userBtcpayDetails.btcpayUserAuthToken, limit);
    } else {
        throw new UserBtcpayException(`Cannot get invoices because user ${userEmail} has not btcpay yet!`,
        UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoicePdf = async (userEmail: string, invoiceId: string): Promise<Buffer> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const invoice: Invoice = await getBtcpayInvoice(userBtcpayDetails.btcpayUserAuthToken, invoiceId);
        const lnd: Lnd | undefined = await findUserActiveLnd(userEmail);
        if (lnd) {
            const lndInfo: LndInfo | undefined = await lndGetInfo(lnd.lndRestAddress, lnd.macaroonHex!);
            if (lndInfo) {
                const lndUri: string = lndInfo.uri;
                return await generateInvoicePdf(invoice, userEmail, lndUri);
            } else {
                throw new UserBtcpayException(`Cannot get pdf invoice because could not get LND info for ${userEmail} and lnd id ${lnd.lndId}, rest address ${lnd.lndRestAddress}!`,
                    UserBtcpayErrorType.COULD_NOT_GET_LND_INFO);
            }
        } else {
            throw new UserBtcpayException(`Cannot get pdf invoice because user ${userEmail} has not LND yet!`,
                UserBtcpayErrorType.USER_HAS_NOT_LND);
        }
    } else {
        throw new UserBtcpayException(`Cannot get pdf invoice because user ${userEmail} has not btcpay yet!`,
            UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};
