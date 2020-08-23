import * as path from 'path';

const fs = require('fs');
import * as pdf from 'pdfjs';
import { Invoice } from 'btcpay';
import { addMinutes, formatDateWithTime, minutesToDays } from '../utils/date-service';
import { getNumberProperty, getProperty } from '../../../application/property-service';
const logoSrc = fs.readFileSync(path.resolve(__dirname, 'BITTERY.jpg'));
const font = fs.readFileSync(path.resolve(__dirname, 'Lato-Regular.ttf'));
// @ts-ignore
export const generateInvoicePdf = async (invoice: Invoice, userEmail: string, lndAddress: string): Promise<Buffer> => {
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

    doc.cell().text({ textAlign: 'left' }).add(`Invoice: ${invoice.id}`);
    doc.cell().text(`Invoice date: ${formatDateWithTime(invoice.invoiceTime)}`);
    const btcpayPaymentExpirationMinutes: number = getNumberProperty('BTCPAY_PAYMENT_EXPIRATION_MINUTES');
    doc.cell().text(`Payment due date : ${formatDateWithTime(addMinutes(invoice.invoiceTime, getNumberProperty('BTCPAY_PAYMENT_EXPIRATION_MINUTES')))}`);
    doc.cell({ paddingBottom: 0.5 * pdf.cm }).text(`Valid: ${minutesToDays(btcpayPaymentExpirationMinutes)} days`);

    const partiesTable = doc.table({
        widths: [5 * pdf.cm, 9 * pdf.cm, 5 * pdf.cm],
    });

    const addParties = () => {
        const row1 = partiesTable.row();
        row1.cell('Seller', { fontSize: 16 });
        row1.cell('');
        if (invoice.buyer.name) {
            row1.cell('Buyer', { fontSize: 16 });
        }

        const row2 = partiesTable.row();
        row2.cell(`Email: ${userEmail}`, { fontSize: 10 });
        row2.cell('');
        if (invoice.buyer.name) {
            row2.cell(invoice.buyer.name, { fontSize: 10 }!);
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
    itemsTableHeader.cell(`Price ${invoice.currency}`, { textAlign: 'right' });
    itemsTableHeader.cell('Price BTC', { textAlign: 'right' });

    function addRow(qty: number, itemDescription: string, price: string, btcPrice: string) {
        const itemsTableRow = itemsTable.row();
        itemsTableRow.cell(qty.toString());
        itemsTableRow.cell(itemDescription);

        itemsTableRow.cell(price, { textAlign: 'right' });
        itemsTableRow.cell(btcPrice, { textAlign: 'right' });
    }
    const description: string = invoice.itemDesc ? invoice.itemDesc! : '';
    addRow(1, description, invoice.price.toFixed(2), invoice.btcPrice);

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
    doc.cell(invoice.bitcoinAddress, {  fontSize: 10, paddingLeft: 0.5 * pdf.cm });
    const lightningInfoType = invoice.cryptoInfo.filter(info => info.paymentType === 'LightningLike')[0];
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
        doc.cell(lightningInfoType.address, { fontSize: 10,  paddingLeft: 0.5 * pdf.cm  });

        doc.cell('Lightning Node address', {
            fontSize: 12,
            paddingLeft: 0.5 * pdf.cm,
        });

        doc.cell(lndAddress, { fontSize: 10, paddingLeft: 0.5 * pdf.cm });
    }

    doc.cell('Payment widget', {
        fontSize: 16,
        paddingTop: 0.5 * pdf.cm,
    });
    doc.cell('Direct payment widget URL');
    doc.cell(`${getProperty('CLIENT_URL_ADDRESS')}/invoices/${invoice.id}`, {
        link: `${getProperty('CLIENT_URL_ADDRESS')}/invoices/${invoice.id}`,
        color: 0x0074D9,
        fontSize: 14,
        textAlign: 'left',
        paddingLeft: 0.5 * pdf.cm,
    });
    doc.footer().pageNumber((curr: any, total: any) => `${curr}/${total}`, { textAlign: 'center' });
    // doc.pipe(fs.createWriteStream('output.pdf'));
    // await doc.end();
    return await doc.asBuffer();
};
