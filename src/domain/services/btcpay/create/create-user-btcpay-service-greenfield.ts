import { logError, logInfo } from '../../../../application/logging-service';
import { getNumberProperty, getProperty } from '../../../../application/property-service';
import axios from 'axios';
import { generateBtcPayCustomLndAddress } from '../../lnd/lnd-btcpay-address-generator-service';
import { UserBtcpayDetails } from '../../../model/btcpay/user-btcpay-details';
import { Lnd } from '../../../model/lnd/lnd';

export const initializeBtcpayServices = async (
        userEmail: string,
        bip49RootPublicKey: string,
        lnd: Lnd,
        storeName: string): Promise<UserBtcpayDetails> => {
    logInfo(`Initializing BTCPay services for user LND: ${lnd.lndId}`);
    const storeId: string = await createStore(storeName);
    await addBtcRootPublicKeyToStore(storeId, bip49RootPublicKey);
    const lndAddress: string = generateBtcPayCustomLndAddress(
        lnd.lndRestAddress,
        lnd.macaroonHex!,
        lnd.tlsCertThumbprint,
    );
    await setLndNodeToStore(storeId, lndAddress);
    const apiKeyForUser: string = await createNewApiKeyForUser(storeId);
    return new UserBtcpayDetails(userEmail, storeId, apiKeyForUser);
};

const createStore = async (storeName: string): Promise<string> => {
    try {
        const res = await axios.post(`${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores`, {
            name: storeName,
            customLogo: getProperty('CUSTOM_LOGO_BTCPAY_URL'),
            customCss: getProperty('CUSTOM_CSS_BTCPAY_URL'),
            defaultPaymentMethod: 'BTC_LightningNetwork',
            speedPolicy: 'MediumSpeed',
            recommendedFeeBlockTarget: 5,
        }, {
            headers: {
                Authorization: `token ${getProperty('BTCPAY_ADMIN_API_KEY')}`
            },
        });
        const storeId: string = res.data.id;
        logInfo(`Store ${storeName} created. Id: ${storeId}`);
        return storeId;
    } catch (err) {
        logError(`Creating store ${storeName} failed!. Err: `, err.message);
        throw err;
    }
};

export const addBtcRootPublicKeyToStore = async (storeId: string, bip49RootPublicKey: string): Promise<void> => {
    try {
        await axios.put(`${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores/${storeId}/payment-methods/OnChain/BTC`, {
            enabled: true,
            cryptoCode: 'BTC',
            derivationScheme: bip49RootPublicKey,
            defaultPaymentMethod: 'BTC_LightningNetwork',
            label: 'LABEL PLATNOSCI',
        }, {
            headers: {
                Authorization: `token ${getProperty('BTCPAY_ADMIN_API_KEY')}`
            },
        });
        logInfo(`BTC root public key added to store with id ${storeId}`);

    } catch (err) {
        logError(`Failed adding BTC root public key added to store with id ${storeId}!. Err:`, err.message);
        throw err;
    }
};

const setLndNodeToStore = async (storeId: string, lndBtcpayUrl: string): Promise<void> => {
    try {
        await axios.put(`${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/stores/${storeId}/payment-methods/LightningNetwork/BTC`, {
            enabled: true,
            cryptoCode: 'BTC',
            connectionString: lndBtcpayUrl,
        }, {
            headers: {
                Authorization: `token ${getProperty('BTCPAY_ADMIN_API_KEY')}`
            },
        });
        logInfo(`Lightning Network connection string added to store with id ${storeId}`);

    } catch (err) {
        logError(`Failed adding Lightning Network connection string added to store with id ${storeId}!. Err:`, err.message);
        throw err;
    }
};

const createNewApiKeyForUser = async (storeId: string): Promise<string> => {
    try {
        const res = await axios.post(`${getProperty('BTCPAY_BACKEND_ONLY_URL')}/api/v1/api-keys`, {
            label: `${storeId}_API_KEY`,
            permissions: [
                `btcpay.store.cancreateinvoice:${storeId}`,
                `btcpay.store.canviewinvoices:${storeId}`,
            ],
        }, {
            headers: {
                Authorization: `token ${getProperty('BTCPAY_ADMIN_API_KEY')}`
            },
        });
        logInfo(`Creating API KEY for store with id ${storeId} succeed!`);
        return res.data.apiKey;

    } catch (err) {
        logError(`Creating API KEY for store with id ${storeId} failed! Err: `, err.message);
        throw err;
    }

}

export const updateLndInStore = async (storeId: string, lndBtcpayUrl: string) => {
    await setLndNodeToStore(storeId, lndBtcpayUrl);
};
