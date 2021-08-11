import { getProperty } from '../../../application/property-service';
import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { InvoiceValidityType } from '../../model/payments/invoice-validity-type';
import { generateUuid } from '../utils/id-generator-service';
import axios from 'axios';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { BtcpayInvoice } from '../../model/btcpay/invoices/btcpay-invoice';
import { InvoiceData } from 'btcpay-greenfield-node-client';

export const BTC_PAYMENTS_DONE_TYPE = 'BTC';
export const LN_PAYMENTS_DONE_TYPE = 'BTC-LightningNetwork';

export const createBtcpayInvoice = async (saveInvoiceDto: SaveInvoiceDto, userBtcpayDetails: UserBtcpayDetails): Promise<InvoiceData> => {
    const priceStringWithReplacesComas: string = saveInvoiceDto.amount.replace(',', '.');
    const res = await axios.post(`${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores/${userBtcpayDetails.storeId}/invoices`, {
        currency: saveInvoiceDto.currency,
        amount: Number(priceStringWithReplacesComas),
        metadata: {
            buyerName:  saveInvoiceDto.buyer,
            itemDesc: saveInvoiceDto.itemDesc,
            orderId: generateUuid(),
        },
        checkout: {
            expirationMinutes: 1,
        },
    }, {
        headers: {
            Authorization: `token ${userBtcpayDetails.apiKey}`
        },
    });
    return res.data;
};

const getInvoiceValidityInMinutes = (invoiceValidity: InvoiceValidityType): number => {
    switch (invoiceValidity) {
        case InvoiceValidityType.ONE_HOUR:
            return 60;
        case InvoiceValidityType.FOUR_HOURS:
            return 4 * 60;
        case InvoiceValidityType.TWELVE_HOURS:
            return 12 * 60;
        case InvoiceValidityType.ONE_DAY:
            return 24 * 60;
        case InvoiceValidityType.THREE_DAYS:
            return 3 * 24 * 60;
        case InvoiceValidityType.SEVEN_DAYS:
            return 7 * 24 * 60;
        case InvoiceValidityType.THIRTY_DAYS:
            return 30 * 24 * 60;
        default:
            throw new Error(`Cannot get invoice validity in minutes for unknown invoice validity type: ${invoiceValidity}`);
    }
};

// export const createBtcpayInvoiceForBitterySubscription = async (
//         saveInvoiceDto: SaveInvoiceDto, use: BtcpayUserAuthToken, invoiceOwnerEmail: string): Promise<BtcpayInvoice> => {
//
//     createBtcpayInvoice(saveInvoiceDto, )
    // const keyPair = btcpay.crypto.load_keypair(Buffer.from(btcpayUserAuthToken.privateKey, 'hex'));
    // const clientFinal = new btcpay.BTCPayClient(getProperty('BTCPAY_URL'),
    //     keyPair, { merchant: btcpayUserAuthToken.merchantToken });
    // const invoiceOwnerEmailBase64: string = Buffer.from(invoiceOwnerEmail).toString('base64');
    // const res = await clientFinal.create_invoice({
    //     currency: saveInvoiceDto.currency,
    //     price: saveInvoiceDto.amount,
    //     itemDesc: saveInvoiceDto.itemDesc,
    //     buyer: {
    //         name: saveInvoiceDto.buyer,
    //     },
    //     extendedNotifications: true,
    //     fullNotifications: true,
    //     notificationURL: `http://172.18.0.1:3001/btcpay/billing/invoice/${getProperty('BTCPAY_WEBHOOK_SECRET_KEY')}/${invoiceOwnerEmailBase64}`,
    //     // za 60 sekund!!!
    //     expirationTime: new Date().getTime() + 1000 * 60,
    //     // todo tylko dla testow zamienione!!!
    //     // expirationTime: getInvoiceValidityInMillisecs(saveInvoiceDto.invoiceValidity),
    // });
    // return new BtcpayInvoice(res.id, res.url);
    // @ts-ignore
    // return undefined;
// };

// if orderIds not given - will find all
export const getBtcpayInvoices = async (userBtcpayDetails: UserBtcpayDetails, orderIds: string[]): Promise<BtcpayInvoice[]> => {
    let queryParamPart: string = orderIds.map(_ => `orderId=${_}&`).toString().replaceAll(',', '');
    // cut last &
    queryParamPart = queryParamPart.substr(0, queryParamPart.length - 1);
    const uri = `${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores/${userBtcpayDetails.storeId}/invoices?${queryParamPart}`;
    const res = await axios.get(uri, {
        headers: {
            Authorization: `token ${userBtcpayDetails.apiKey}`
        },
    });
    const invoices: InvoiceData[] = res.data;
    const btcpayInvoices: BtcpayInvoice[] = [];
    for (const invoiceData of invoices) {
        // Client expects milliseconds...
        invoiceData.createdTime! *= 1000;
        invoiceData.expirationTime! *= 1000;
        const getPaymentsUri = `${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores/${userBtcpayDetails.storeId}/invoices/${invoiceData.id}/payment-methods`;
        const res2 = await axios.get(getPaymentsUri, {
            headers: {
                Authorization: `token ${userBtcpayDetails.apiKey}`
            },
        });
        btcpayInvoices.push(new BtcpayInvoice(invoiceData, res2.data));
    }
    return btcpayInvoices;
};

export const getBtcpayInvoice = async (userBtcpayDetails: UserBtcpayDetails, invoiceId: string): Promise<BtcpayInvoice> => {
    const res = await axios.get(`${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores/${userBtcpayDetails.storeId}/invoices/${invoiceId}`, {
        headers: {
            Authorization: `token ${userBtcpayDetails.apiKey}`
        },
    });
    // Client expects milliseconds...
    res.data.createdTime! *= 1000;
    res.data.expirationTime! *= 1000;
    const getPaymentsUri = `${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores/${userBtcpayDetails.storeId}/invoices/${res.data.id}/payment-methods`;
    const res2 = await axios.get(getPaymentsUri, {
        headers: {
            Authorization: `token ${userBtcpayDetails.apiKey}`
        },
    });
    return new BtcpayInvoice(res.data, res2.data);
};
