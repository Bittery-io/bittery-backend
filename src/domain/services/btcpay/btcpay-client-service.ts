import { getProperty } from '../../../application/property-service';
import { BtcpayUserAuthToken } from '../../model/btcpay/btcpay-user-auth-token';
import { BtcpayInvoice } from '../../model/btcpay/btcpay-invoice';
import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { Invoice } from 'btcpay';

const btcpay = require('btcpay');

export const createBtcpayInvoice = async (saveInvoiceDto: SaveInvoiceDto, btcpayUserAuthToken: BtcpayUserAuthToken): Promise<BtcpayInvoice> => {
    const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    const clientFinal = new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
        keyPair, { merchant: btcpayUserAuthToken.merchantToken });
    const res = await clientFinal.create_invoice({
        currency: saveInvoiceDto.currency,
        price: saveInvoiceDto.amount,
        itemDesc: saveInvoiceDto.itemDesc,
        buyer: {
            name: saveInvoiceDto.buyer,
        },
    });
    return new BtcpayInvoice(res.id, res.url);
};

export const getBtcpayInvoices = async (btcpayUserAuthToken: BtcpayUserAuthToken): Promise<object[]> => {
    const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    const clientFinal = new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
        keyPair, { merchant: btcpayUserAuthToken.merchantToken });
    return await clientFinal.get_invoices({ limit: 50 });
};

export const getBtcpayInvoice = async (btcpayUserAuthToken: BtcpayUserAuthToken, invoiceId: string): Promise<Invoice> => {
    const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    const clientFinal = new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
        keyPair, { merchant: btcpayUserAuthToken.merchantToken });
    return await clientFinal.get_invoice(invoiceId);
};
