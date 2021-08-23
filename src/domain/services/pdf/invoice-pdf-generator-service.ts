import * as path from 'path';

const fs = require('fs');
import * as pdf from 'pdfjs';
import {
    formatDateWithTime,
    getDaysBetween,
    getHoursBetween,
    getMinutesBetween,
} from '../utils/date-service';
import { getProperty } from '../../../application/property-service';
import { BtcpayInvoice } from '../../model/btcpay/invoices/btcpay-invoice';
import { InvoicePaymentMethodDataModel } from 'btcpay-greenfield-node-client';
import { BTC_PAYMENTS_DONE_TYPE, LN_PAYMENTS_DONE_TYPE } from '../btcpay/btcpay-client-service';
const logoSrc = fs.readFileSync(path.resolve(__dirname, 'BITTERY.jpg'));
const font = fs.readFileSync(path.resolve(__dirname, 'Lato-Regular.ttf'));
// @ts-ignore
export const generateInvoicePdf = async (invoice: BtcpayInvoice, sellerStoreName: string, lndAddress: string): Promise<Buffer> => {
    // keep 19 cm width
    const logo = new pdf.Image(logoSrc);
    const doc = new pdf.Document({
        font: new pdf.Font(font),
    });
    const headerTable = doc.header().table({ widths: [5 * pdf.cm, 14 * pdf.cm] });
    const headerLine1 = headerTable.row();
    headerLine1.cell({ paddingBottom: 0.5 * pdf.cm }).image(logo, { height: 1.5 * pdf.cm, link: 'https://bittery.io' });
    headerLine1.cell().text('bittery.io', {
        link: 'https://bittery.io',
        textAlign: 'right',
        alignment: 'right',
        color: 0x0074D9,
        fontSize: 18,
    }).add('- better Bitcoin payments');

    doc.cell().text({ textAlign: 'left' }).add(`Invoice ID: ${invoice.invoiceData.id}`);
    doc.cell().text(`Invoice date: ${formatDateWithTime(invoice.invoiceData.createdTime!)}`);
    doc.cell().text(`Payment due date : ${formatDateWithTime(invoice.invoiceData.expirationTime!)}`);

    let validText: string;
    const invoiceDaysValid: string = getDaysBetween(invoice.invoiceData.expirationTime!, invoice.invoiceData.createdTime!).toFixed(0);
    if (invoiceDaysValid === '0') {
        const invoiceHoursValid: string = getHoursBetween(invoice.invoiceData.expirationTime!, invoice.invoiceData.createdTime!).toFixed(0);
        if (invoiceHoursValid === '0') {
            const invoiceMinutesValid: string = getMinutesBetween(invoice.invoiceData.expirationTime!, invoice.invoiceData.createdTime!).toFixed(0);
            validText = `Validity: ${invoiceMinutesValid} minutes`;
        } else {
            validText = `Validity: ${invoiceHoursValid} hours`;
        }
    } else {
        validText = `Validity: ${invoiceDaysValid} days`;
    }
    doc.cell().text(validText);
    doc.cell({ paddingBottom: 0.5 * pdf.cm }).text(`Status: ${invoice.invoiceData.status}`);

    const partiesTable = doc.table({
        widths: [5 * pdf.cm, 9 * pdf.cm, 5 * pdf.cm],
    });

    const addParties = () => {
        const row1 = partiesTable.row();
        row1.cell('Seller', { fontSize: 16 });
        row1.cell('');
        row1.cell('Buyer', { fontSize: 16 });

        const row2 = partiesTable.row();
        row2.cell(sellerStoreName, { fontSize: 10 });
        row2.cell('');
        if (invoice.invoiceData.metadata.buyerName) {
            row2.cell(invoice.invoiceData.metadata.buyerName, { fontSize: 10 }!);
        }
    };
    addParties();
    doc.cell({
        paddingBottom: 0.5 * pdf.cm,
    });

    const itemsTable = doc.table({
        widths: [1.5 * pdf.cm, 10 * pdf.cm, 4 * pdf.cm, 4 * pdf.cm],
        borderHorizontalWidths: (i: number) => (i < 2 ? 1 : 0.1),
        padding: 5,
    });

    // @ts-ignore
    const itemsTableHeader = itemsTable.header({ borderBottomWidth: 1.5 });
    itemsTableHeader.cell('#');
    itemsTableHeader.cell('Item description');
    itemsTableHeader.cell(`Price ${invoice.invoiceData.currency}`, { textAlign: 'right' });
    itemsTableHeader.cell('Price BTC', { textAlign: 'right' });

    function addRow(qty: number, itemDescription: string, price: string, btcPrice: string) {
        const itemsTableRow = itemsTable.row();
        itemsTableRow.cell(qty.toString());
        itemsTableRow.cell(itemDescription);

        itemsTableRow.cell(price, { textAlign: 'right' });
        itemsTableRow.cell(btcPrice, { textAlign: 'right' });
    }
    const description: string = invoice.invoiceData.metadata.itemDesc ? invoice.invoiceData.metadata.itemDesc! : '';
    addRow(1, description, Number(invoice.invoiceData.amount!).toFixed(2), invoice.invoicePayments[0].amount!);

    doc.cell('Payment methods', {
        fontSize: 16,
        paddingTop: 0.5 * pdf.cm,
    });
    doc.cell('Possible payments methods');

    doc.cell('BTC [on-chain]', {
        paddingTop: 0.3 * pdf.cm,
        fontSize: 14,
        paddingLeft: 0.5 * pdf.cm,
    });
    doc.cell('Payment address', {
        fontSize: 12,
        paddingLeft: 0.5 * pdf.cm,
    });
    doc.cell(invoice.invoicePayments.filter(_ => _.paymentMethod === BTC_PAYMENTS_DONE_TYPE)[0].destination, {  fontSize: 10, paddingLeft: 0.5 * pdf.cm });
    const lightningInfoType: InvoicePaymentMethodDataModel = invoice.invoicePayments.filter(_ => _.paymentMethod === LN_PAYMENTS_DONE_TYPE)[0];
    if (lightningInfoType) {
        doc.cell('BTC [Lightning Network]', {
            paddingTop: 0.3 * pdf.cm,
            fontSize: 14,
            paddingLeft: 0.5 * pdf.cm,
        });
        doc.cell('BOLT 11 invoice (payment address)', {
            fontSize: 12,
            paddingLeft: 0.5 * pdf.cm,
        });
        doc.cell(lightningInfoType.destination, { fontSize: 10,  paddingLeft: 0.5 * pdf.cm  });

        doc.cell('Lightning Node address', {
            fontSize: 12,
            paddingLeft: 0.5 * pdf.cm,
            link: undefined,
        });

        doc.cell(lndAddress, { fontSize: 10, paddingLeft: 0.5 * pdf.cm });
    }

    doc.cell('Payment widget', {
        fontSize: 16,
        paddingTop: 0.5 * pdf.cm,
    });
    doc.cell('Direct payment widget URL');
    doc.cell(`${getProperty('CLIENT_URL_ADDRESS')}/invoices/${invoice.invoiceData.id}`, {
        link: `${getProperty('CLIENT_URL_ADDRESS')}/invoices/${invoice.invoiceData.id}`,
        color: 0x0074D9,
        fontSize: 14,
        textAlign: 'left',
    });
    doc.footer().pageNumber((curr: any, total: any) => `${curr}/${total}`, { textAlign: 'center', fontSize: 16 });
    // doc.pipe(fs.createWriteStream('output.pdf'));
    // await doc.end();
    return await doc.asBuffer();
};
