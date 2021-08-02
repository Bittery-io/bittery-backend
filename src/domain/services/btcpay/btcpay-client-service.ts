import { getProperty } from '../../../application/property-service';
import { BtcpayUserAuthToken } from '../../model/btcpay/btcpay-user-auth-token';
import { BtcpayInvoice } from '../../model/btcpay/btcpay-invoice';
import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { Invoice } from 'btcpay';
import { InvoiceValidityType } from '../../model/payments/invoice-validity-type';
import { generateUuid } from '../utils/id-generator-service';

const btcpay = require('btcpay');

export const createBtcpayInvoice = async (saveInvoiceDto: SaveInvoiceDto, btcpayUserAuthToken: BtcpayUserAuthToken): Promise<BtcpayInvoice> => {
    const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    const clientFinal = new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
        keyPair, { merchant: btcpayUserAuthToken.merchantToken });
    const priceStringWithReplacesComas: string = saveInvoiceDto.amount.replace(',', '.');
    const res = await clientFinal.create_invoice({
        currency: saveInvoiceDto.currency,
        price: Number(priceStringWithReplacesComas),
        itemDesc: saveInvoiceDto.itemDesc,
        buyer: {
            name: saveInvoiceDto.buyer,
        },
        orderId: generateUuid(),
        expirationTime: getInvoiceValidityInMillisecs(saveInvoiceDto.invoiceValidity),
    });
    return new BtcpayInvoice(res.id, res.url);
};

const getInvoiceValidityInMillisecs = (invoiceValidity: InvoiceValidityType): number => {
    const now: number = new Date().getTime();
    const oneMinuteInMillisecs: number = 1000 * 60;
    switch (invoiceValidity) {
        case InvoiceValidityType.ONE_HOUR:
            return now + (60 * oneMinuteInMillisecs);
        case InvoiceValidityType.FOUR_HOURS:
            return now + (4 * 60 * oneMinuteInMillisecs);
        case InvoiceValidityType.TWELVE_HOURS:
            return now + (12 * 60 * oneMinuteInMillisecs);
        case InvoiceValidityType.ONE_DAY:
            return now + (24 * 60 * oneMinuteInMillisecs);
        case InvoiceValidityType.THREE_DAYS:
            return now + (3 * 24 * 60 * oneMinuteInMillisecs);
        case InvoiceValidityType.SEVEN_DAYS:
            return now + (7 * 24 * 60 * oneMinuteInMillisecs);
        case InvoiceValidityType.THIRTY_DAYS:
            return now + (30 * 24 * 60 * oneMinuteInMillisecs);
        default:
            throw new Error(`Cannot get invoice validity in millisecs for unknown invoice validity type: ${invoiceValidity}`);
    }
};

export const createBtcpayInvoiceForBitterySubscription = async (
        saveInvoiceDto: SaveInvoiceDto, btcpayUserAuthToken: BtcpayUserAuthToken, invoiceOwnerEmail: string): Promise<BtcpayInvoice> => {
    const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    const clientFinal = new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
        keyPair, { merchant: btcpayUserAuthToken.merchantToken });
    const invoiceOwnerEmailBase64: string = Buffer.from(invoiceOwnerEmail).toString('base64');
    const res = await clientFinal.create_invoice({
        currency: saveInvoiceDto.currency,
        price: saveInvoiceDto.amount,
        itemDesc: saveInvoiceDto.itemDesc,
        buyer: {
            name: saveInvoiceDto.buyer,
        },
        extendedNotifications: true,
        fullNotifications: true,
        notificationURL: `http://172.18.0.1:3001/btcpay/billing/invoice/${getProperty('BTCPAY_WEBHOOK_SECRET_KEY')}/${invoiceOwnerEmailBase64}`,
        // za 60 sekund!!!
        expirationTime: new Date().getTime() + 1000 * 60,
        // todo tylko dla testow zamienione!!!
        // expirationTime: getInvoiceValidityInMillisecs(saveInvoiceDto.invoiceValidity),
    });
    return new BtcpayInvoice(res.id, res.url);
};

const getClient = (btcpayUserAuthToken: BtcpayUserAuthToken) => {
    const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    return new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
        keyPair, { merchant: btcpayUserAuthToken.merchantToken });
};

export const getBtcpayInvoices = async (btcpayUserAuthToken: BtcpayUserAuthToken, limit: number): Promise<Invoice[]> => {
    const clientFinal = getClient(btcpayUserAuthToken);
    return await clientFinal.get_invoices({ limit });
};

export const getBtcpayInvoicesBetweenDate = async (btcpayUserAuthToken: BtcpayUserAuthToken,
                                                   dateStart: string,
                                                   dateEnd: string): Promise<Invoice[]> => {
    const clientFinal = getClient(btcpayUserAuthToken);
    return await clientFinal.get_invoices({ dateStart, dateEnd });
};

export const getBtcpayInvoice = async (btcpayUserAuthToken: BtcpayUserAuthToken, invoiceId: string): Promise<Invoice> => {
    const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    const clientFinal = new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
        keyPair, { merchant: btcpayUserAuthToken.merchantToken });
    return await clientFinal.get_invoice(invoiceId);
};
