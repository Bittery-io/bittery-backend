import * as util from 'util';
import * as fs from 'fs';

const btcpay = require('btcpay');
const writeFile = util.promisify(fs.writeFile);

const BTCPAY_URL: string = 'http://localhost';
const PAIRCODE: string = 'zVtiaL8';

if (BTCPAY_URL === 'todo' || PAIRCODE === 'todo') {
    console.log('Fill url and paircode!');
    process.exit(0);
}

const generateApiToken = async (): Promise<void> => {
    const keyPair = btcpay.crypto.generate_keypair();
    const rest: any = await new btcpay.BTCPayClient(BTCPAY_URL, keyPair).pair_client(PAIRCODE);
    await writeFile('./bittery-api-token.txt', Buffer.from(`
Paircode: ${PAIRCODE}
Merchant: ${rest.merchant},
Private key hex: ${keyPair.getPrivate().toString('hex')}`, 'utf8'));
    console.log('Done! File saved: bittery-api-token.txt');
};
generateApiToken();
