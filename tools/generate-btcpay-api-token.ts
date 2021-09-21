import * as util from 'util';
import * as fs from 'fs';
const btcpay = require('btcpay');
const writeFile = util.promisify(fs.writeFile);
/**
 * todo THIS IS ALREADY OUTDATED - now with greenfield API it is not usable anymore.
 *
 * Go to store and select Access Token from menu. Create new token.
 * Provide label. Request pairing.
 * Copy generated (in green bar) pairing code.
 */
// setup
const BTCPAY_URL: string = 'http://localhost';
// setup
const PAIRCODE: string = 'bU5TgsB';

if (BTCPAY_URL === 'todo' || PAIRCODE === 'todo') {
    console.log('Fill url and paircode!');
    process.exit(0);
}

const generateBtcpayApiToken = async (): Promise<void> => {
    const keyPair = btcpay.crypto.generate_keypair();
    const rest: any = await new btcpay.BTCPayClient(BTCPAY_URL, keyPair).pair_client(PAIRCODE);
    await writeFile('./bittery-api-token.txt', Buffer.from(`
Paircode: ${PAIRCODE}
Merchant: ${rest.merchant},
Private key hex: ${keyPair.getPrivate().toString('hex')}
########################
To export:
BTCPAY_BITTERY_MERCHANT_TOKEN=${rest.merchant}
BTCPAY_BITTERY_PRIVATE_KEY=${keyPair.getPrivate().toString('hex')}
`, 'utf8'));
    console.log('Done! File saved: bittery-api-token.txt');
};
generateBtcpayApiToken();
