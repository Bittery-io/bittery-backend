import axios from 'axios';
import * as util from 'util';
import * as fs from 'fs';

const writeFile = util.promisify(fs.writeFile);

// const URL = getProperty('BTCPAY_BACKEND_ONLY_URL');
// const STORE_ID = getProperty('BITTERY_SUBSCRIPTION_PAYMENTS_STORE_ID');
// const ADMIN_API_KEY = getProperty('BTCPAY_ADMIN_API_KEY');
// const WEBHOOK_URL = getProperty('BTCPAY_FACADE_WEBHOOK_SECRET');

const URL = 'http://localhost';
const STORE_ID = '8pR2S7ZWhfHULfMDixVDXzwVUBeY4FRfLpsnWs3xdY86'
const ADMIN_API_KEY = '2a4501a4ef6cd7463bff15d2177f38284eac06ff';
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
BTCPAY_WEBHOOK_SECRET=${res.data.secret}
`, 'utf8'));
    } catch (err) {
        console.log(err.response);
    }
};
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
