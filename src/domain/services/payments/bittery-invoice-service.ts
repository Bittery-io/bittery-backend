import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { createBtcpayInvoice, getBtcpayInvoice } from '../btcpay/btcpay-client-service';
import { getProperty } from '../../../application/property-service';
import { logInfo } from '../../../application/logging-service';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { InvoiceData } from 'btcpay-greenfield-node-client';
import { BtcpayInvoice } from '../../model/btcpay/invoices/btcpay-invoice';

export const BITTERY_USER_BTCPAY_DETAILS: UserBtcpayDetails = new UserBtcpayDetails(
// @ts-ignore
    undefined,
    getProperty('BITTERY_SUBSCRIPTION_PAYMENTS_STORE_ID'),
    getProperty('BTCPAY_ADMIN_API_KEY'),
);

export const saveBitteryInvoice = async (userEmail: string, saveInvoiceDto: SaveInvoiceDto): Promise<InvoiceData> => {
    const invoiceData: InvoiceData = await createBtcpayInvoice(saveInvoiceDto, BITTERY_USER_BTCPAY_DETAILS);
    logInfo(`Saved Bittery product invoice with id ${invoiceData.id} for user email ${userEmail}`);
    return invoiceData;
};

export const getBitteryInvoice = async (invoiceId: string): Promise<BtcpayInvoice> => {
    return await getBtcpayInvoice(BITTERY_USER_BTCPAY_DETAILS, invoiceId);
};
