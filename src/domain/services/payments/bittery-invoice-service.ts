import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { createBtcpayInvoiceForBitterySubscription, getBtcpayInvoice } from '../btcpay/btcpay-client-service';
import { BtcpayInvoice } from '../../model/btcpay/btcpay-invoice';
import { Invoice } from 'btcpay';
import { BtcpayUserAuthToken } from '../../model/btcpay/btcpay-user-auth-token';
import { getProperty } from '../../../application/property-service';
import { logInfo } from '../../../application/logging-service';

export const BTCPAY_BITTERY_USER_AUTH_TOKEN = new BtcpayUserAuthToken(
    getProperty('BTCPAY_BITTERY_MERCHANT_TOKEN'),
    getProperty('BTCPAY_BITTERY_PRIVATE_KEY'),
);

export const saveBitteryInvoice = async (userEmail: string, saveInvoiceDto: SaveInvoiceDto): Promise<BtcpayInvoice> => {
    const invoice: BtcpayInvoice = await createBtcpayInvoiceForBitterySubscription(saveInvoiceDto, BTCPAY_BITTERY_USER_AUTH_TOKEN, userEmail);
    logInfo(`Saved Bittery product invoice with id ${invoice.id} for user email ${userEmail}`);
    return invoice;
};

export const getBitteryInvoice = async (invoiceId: string): Promise<Invoice> => {
    return await getBtcpayInvoice(BTCPAY_BITTERY_USER_AUTH_TOKEN, invoiceId);
};
