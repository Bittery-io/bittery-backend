import * as path from 'path';

const fs = require('fs');
import * as pdf from 'pdfjs';
import { Invoice } from 'btcpay';
import {  formatDateWithoutTime } from '../utils/date-service';
const logoSrc = fs.readFileSync(path.resolve(__dirname, 'BITTERY.jpg'));
const font = fs.readFileSync(path.resolve(__dirname, 'AlegreyaSans-Regular.ttf'));
// @ts-ignore
export const generateInvoicePdf = async (invoice: Invoice): Promise<Buffer> => {
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
        fontSize: 22,
    }).add('- better Bitcoin payments');

    doc.cell().text({ textAlign: 'left', fontSize: 20 }).add(`Invoice ${invoice.id}`);
    doc.cell({ paddingBottom: 1 * pdf.cm }).text(`Invoice date: ${formatDateWithoutTime(invoice.invoiceTime)}`);

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
        row2.cell('');
        row2.cell('');
        if (invoice.buyer.name) {
            row2.cell(invoice.buyer.name!);
        }
    };
    addParties();
    doc.cell({
        paddingBottom: 1 * pdf.cm,
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
        fontSize: 20,
        paddingTop: 0.5 * pdf.cm,
    });

    doc.cell('BTC ₿', {
        fontSize: 16,
    });
    doc.cell('Payment address', {
        fontSize: 14,
    });
    doc.cell(invoice.bitcoinAddress);
    const lightningInfoType = invoice.cryptoInfo.filter(info => info.paymentType === 'LightningLike')[0];
    if (lightningInfoType) {
        doc.cell('BTC Lightning Network', {
            paddingTop: 0.5 * pdf.cm,
            fontSize: 16,
        });
        doc.cell('Payment address', {
            fontSize: 14,
        });
        doc.cell(lightningInfoType.address);

        doc.cell('Lightning Node info', {
            fontSize: 14,
        });

        doc.cell('039ac5cf32c9c1692b7986ce6717049d9bbcc1f70c724eff0aad01b2b502eebd65@192.168.1.2:9777');
    }

    doc.cell('Payment widget', {
        fontSize: 20,
        paddingTop: 0.5 * pdf.cm,
    });
    doc.cell('Open the link for direct payment widget');
    doc.cell(`http://localhost:8080/invoices/${invoice.id}`, {
        link: `http://localhost:8080/invoices/${invoice.id}`,
        color: 0x0074D9,
        fontSize: 16,
        textAlign: 'left',
    });
    doc.footer().pageNumber((curr: any, total: any) => `${curr}/${total}`, { textAlign: 'center' });
    // doc.pipe(fs.createWriteStream('output.pdf'));
    // await doc.end();
    return await doc.asBuffer();
};
