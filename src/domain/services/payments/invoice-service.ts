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

export const saveInvoice = async (userEmail: string, saveInvoiceDto: SaveInvoiceDto): Promise<void> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const btcpayInvoice: BtcpayInvoice = await createBtcpayInvoice(saveInvoiceDto, userBtcpayDetails.btcpayUserAuthToken!);
        logInfo(`Created new invoice with id ${btcpayInvoice} for user email ${userEmail}`);
    } else {
        throw new UserBtcpayException(`Cannot create invoice because user ${userEmail} has not btcpay yet!`, UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoices = async (userEmail: string): Promise<object[]> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        return await getBtcpayInvoices(userBtcpayDetails.btcpayUserAuthToken);
    } else {
        throw new UserBtcpayException(`Cannot get invoices because user ${userEmail} has not btcpay yet!`,
        UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoicePdf = async (userEmail: string, invoiceId: string): Promise<Buffer> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const invoice: Invoice =  await getBtcpayInvoice(userBtcpayDetails.btcpayUserAuthToken, invoiceId);
        return await generateInvoicePdf(invoice, userEmail);
    } else {
        throw new UserBtcpayException(`Cannot get pdf invoice because user ${userEmail} has not btcpay yet!`,
            UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};
