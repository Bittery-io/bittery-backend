import axios from 'axios';
import * as util from 'util';
import * as fs from 'fs';

const writeFile = util.promisify(fs.writeFile);

//TODO for PROD: https://btcpay.bittery.io
const URL = 'http://localhost';
//TODO create store and get from btcpay. DO NOT LOSE IT
const STORE_ID = '8pR2S7ZWhfHULfMDixVDXzwVUBeY4FRfLpsnWs3xdY86'
//TODO Create in store. Go to btcpay -> click right corner icon of human -> API Keys from list and create one. DO NOT LOSE IT, keep private
const ADMIN_API_KEY = '2a4501a4ef6cd7463bff15d2177f38284eac06ff';
//TODO for PROD: https://app.bittery.io/api/btcpay/billing/invoice (inside docker-network)
//for localhost: 172.17.0.1 is IP of localhost outside docker (btcpay is calling bittery-backend on localhost)
const WEBHOOK_URL = 'http://172.17.0.1:3001/btcpay/billing/invoice';

export const createBitteryStoreWebhook = async (): Promise<void> => {
    try {
        const res = await axios.post(`${URL}/api/v1/stores/${STORE_ID}/webhooks`, {
            enabled: true,
            automaticRedelivery: true,
            url: WEBHOOK_URL,
            authorizedEvents: {
                everything: 'false',
                specificEvents: ['InvoiceSettled', 'InvoiceExpired'],
            }
        }, {
            headers: {
                Authorization: `token ${ADMIN_API_KEY}`
            },
        });
        console.log(res.data);
        console.log(`Added bittery webhook! Got id: ${res.data.id}`);

        await writeFile('./bittery-store-webhook-.txt', Buffer.from(`
Bittery store webhook creation result:

Store ID: ${STORE_ID}
Webhook URL: ${WEBHOOK_URL}
Webhook ID: ${res.data.id}
Webhook secret: ${res.data.secret}
########################
To export:
BTCPAY_FACADE_WEBHOOK_SECRET=${res.data.secret}
`, 'utf8'));
    } catch (err) {
        console.log(err.response);
    }
};
// can be also deleted manually from btcpay
export const deleteBitteryStoreWebhook = async (): Promise<void> => {
    try {
        const res = await axios.delete(`${URL}/api/v1/stores/${STORE_ID}/webhooks/bittery-invoices-webhook`, {
            headers: {
                Authorization: `token ${ADMIN_API_KEY}`
            },
        });
        console.log(res.data);
        console.log('Removed bittery webhook!');
    } catch (err) {
        console.log(err.response);
    }
};
createBitteryStoreWebhook();
