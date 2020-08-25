import { BtcpayUserAuthToken } from '../../../model/btcpay/btcpay-user-auth-token';
import { generateApiToken } from './btcpay-api-token-generator-service';
import {
    generateBtcPayCustomLndAddress,
    generateBtcPayLndAddress,
} from '../../lnd/lnd-btcpay-address-generator-service';
import { UserBtcpayDetails } from '../../../model/btcpay/user-btcpay-details';
import { getProperty } from '../../../../application/property-service';
import { CustomLnd } from '../../../model/lnd/custom-lnd';
import { logInfo } from '../../../../application/logging-service';
import { formatDateWithTime2 } from '../../utils/date-service';

const puppeteer = require('puppeteer');

const IGNORE_SANDBOX_ERROR = '1';
const USER_NAME = getProperty('BTCPAY_ADMIN_LOGIN');
const PASSWORD = getProperty('BTCPAY_ADMIN_PASSWORD');

export const initializeBtcpayServices = async (
        userEmail: string,
        bip49RootPublicKey: string,
        paymentExpirationMinutes: number,
        userDomain?: string,
        customLnd?: CustomLnd): Promise<UserBtcpayDetails> => {
    let storeName: string;
    if (userDomain) {
        logInfo(`Initializing BTCPay services for user domain ${userDomain}`);
        storeName = `${userEmail}-${userDomain}-${formatDateWithTime2(new Date().getTime())}`;
    } else {
        storeName = `${userEmail}-CUSTOM_LND-${formatDateWithTime2(new Date().getTime())}`;
        logInfo(`Initializing BTCPay services for user with custom LND: ${customLnd?.lndRestAddress}`);
    }
    const browser = await getBrowser();
    const page = (await browser.pages())[0];
    await loginToBtcpay(page);
    const storeId: string = await createStore(storeName, page);
    await addBtcRootPublicKeyToStore(storeId, page, browser, bip49RootPublicKey);
    let lndAddress: string;
    if (customLnd) {
        lndAddress = generateBtcPayCustomLndAddress(
            customLnd.lndRestAddress,
            customLnd.macaroonHex,
            customLnd.tlsCertThumbprint,
        );
    } else {
        lndAddress = generateBtcPayLndAddress(userDomain!);
    }
    await addLndNodeToStore(storeId, lndAddress, page);
    await setExpirationMinutesToStore(storeId, String(paymentExpirationMinutes), page);
    const pairingCode: string = await getBtcpayPairingCode(storeName, storeId, page);
    const btcpayUserAuthToken: BtcpayUserAuthToken = await generateApiToken(pairingCode);
    return new UserBtcpayDetails(userEmail, storeId, btcpayUserAuthToken);
};

const getBrowser = async() => {
    return await puppeteer.launch({ headless: true }).then(
        (v: any) => v,
        (err: any) => {
            if (IGNORE_SANDBOX_ERROR === '1') {
                console.warn(
                    'WARNING!!! Error occurred, Chromium will be started ' +
                    'without sandbox. This wont guarantee success.',
                );
                return puppeteer.launch({
                    headless: true,
                    ignoreDefaultArgs: ['--disable-extensions'],
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                });
            } else {
                console.warn(
                    'If "No usable sandbox!" error, retry test with ' +
                    'BTCPAY_IGNORE_SANDBOX_ERROR=1',
                );
                throw err;
            }
        },
    );
};

export const loginToBtcpay = async (page: any): Promise<void> => {
    await page.setDefaultTimeout(100 * 1000);
    await page.goto(`${getProperty('BTCPAY_URL')}/Account/Login`);
    await page.type('#Email', USER_NAME);
    await page.type('#Password', PASSWORD);
    await page.click('#LoginButton');
    await page.waitForSelector('div.header-content-inner.text-white');
    logInfo(`Successfully logged to BTCPAY`);
};

const getBtcpayPairingCode = async (storeName: string, storeId: string, page: any): Promise<string> => {
    const tokenName = `${storeName}-${new Date().getTime()}`;
    await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}/Tokens/Create`);
    await page.waitForSelector('input#Label');
    await page.waitForSelector('[type="submit"]');
    await page.type('#Label', tokenName);
    await page.click('[type="submit"]');
    await page.waitForSelector('button[type="submit"]');
    await page.click('[type="submit"]');
    await page.waitForSelector('div.alert.alert-success.alert-dismissible');
    const contents = await page.evaluate(() => {
        const el = document.querySelector(
            'div.alert.alert-success.alert-dismissible',
        );
        if (el === null) {
            return '';
        }
        return el.innerHTML;
    });
    const pairingCode = (contents.match(
        /Server initiated pairing code: (\S{7})/,
    ) || [])[1];
    if (!pairingCode) {
        throw new Error('Could not get pairing code');
    }
    logInfo(`Got pairing code for storeId ${storeId}`);
    return pairingCode;
};

const createStore = async (storeName: string, page: any): Promise<string> => {
    await page.goto(`${getProperty('BTCPAY_URL')}/stores/create`);
    await page.waitForSelector('input#Name');
    await page.waitForSelector('[type="submit"]');
    await page.type('#Name', storeName);
    await page.click('[type="submit"]');
    await page.waitForSelector('button[type="submit"]');
    await page.click('[type="submit"]');
    await page.waitForSelector('input#Id');
    const element = await page.$('#Id');
    const storeId = await page.evaluate((element: any) => element.value, element);
    logInfo(`Store ${storeName} created! New Id: ${storeId}, name: ${storeName}`);
    return storeId;
};

const addLndNodeToStore = async (storeId: string, lndBtcpayUrl: string, page: any): Promise<void> => {
    await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}`);
    await page.waitForSelector('a#Modify-LightningBTC');
    await page.click('a#Modify-LightningBTC');
    await page.waitForSelector('input#ConnectionString');
    await page.type('#ConnectionString', lndBtcpayUrl);
    await page.waitForSelector('button[type="submit"]');
    await page.click('[type="submit"]');
    await page.waitForSelector('input#Id');
    logInfo(`Added btcpay lnd address for store with id ${storeId}`);
};

const setExpirationMinutesToStore = async (storeId: string, paymentExpirationMinutes: string, page: any): Promise<void> => {
    await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}`);
    await page.waitForSelector('input#InvoiceExpiration');
    // @ts-ignore
    await page.evaluate(() => document.getElementById('InvoiceExpiration').value = '');
    await page.type('#InvoiceExpiration', paymentExpirationMinutes);
    await page.waitForSelector('button[type="submit"]');
    await page.click('[type="submit"]');
    await page.waitForSelector('div.alert.alert-success.alert-dismissible');
    logInfo(`Set invoice expiration time ${paymentExpirationMinutes} minutes for store ${storeId}`);
};

export const addBtcRootPublicKeyToStore = async (storeId: string, page: any, browser: any, bip49RootPublicKey: string): Promise<void> => {
    await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}`);
    await page.waitForSelector('a#ModifyBTC');
    await page.click('a#ModifyBTC');
    await page.waitForSelector('input#DerivationScheme');
    await page.type('#DerivationScheme', bip49RootPublicKey);
    await page.waitForSelector('button#Continue');
    await page.click('button#Continue');
    await page.waitForSelector('button#Confirm');
    await page.click('button#Confirm');
    await page.waitForSelector('div.alert.alert-success.alert-dismissible');
    // await page.waitForSelector('button#nbxplorergeneratewalletbtn');
    // await page.click('button#nbxplorergeneratewalletbtn');
    // await page.waitForSelector('div.modal.fade.show');
    // await page.waitForSelector('button#btn-generate');
    // const pages = (await browser.pages());
    // const popup = pages[pages.length - 1];
    // await popup.waitForSelector('button#btn-generate');
    // await popup.click('button#btn-generate');
    // await page.waitForSelector('div.alert.alert-success.alert-dismissible');
    // await page.waitForSelector('code.alert-link');
    // const contents = await page.evaluate(() => {
    //     const el = document.querySelector(
    //         'code.alert-link',
    //     );
    //     if (el === null) {
    //         return '';
    //     }
    //     return el.innerHTML;
    // });
    logInfo(`Successfully added Bitcoin root public key for store with id ${storeId}`);
};
