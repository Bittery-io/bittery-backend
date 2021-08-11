// import { BtcpayUserAuthToken } from '../../../model/btcpay/btcpay-user-auth-token';
// import { generateApiToken } from './btcpay-api-token-generator-service';
// import {
//     generateBtcPayCustomLndAddress,
// } from '../../lnd/lnd-btcpay-address-generator-service';
// import { UserBtcpayDetails } from '../../../model/btcpay/user-btcpay-details';
// import { getProperty } from '../../../../application/property-service';
// import { logInfo } from '../../../../application/logging-service';
// import { formatDateWithTime2 } from '../../utils/date-service';
// import { Lnd } from '../../../model/lnd/lnd';
//
// const puppeteer = require('puppeteer');
//
// const IGNORE_SANDBOX_ERROR = '1';
// const USER_NAME = getProperty('BTCPAY_ADMIN_LOGIN');
// const PASSWORD = getProperty('BTCPAY_ADMIN_PASSWORD');
//
// export const updateLndInStore = async (storeId: string, lndBtcpayUrl: string) => {
//     logInfo(`Updating BTCPay services for user store id ${storeId} - changing LND address in store.`);
//     const browser = await getBrowser();
//     const page = (await browser.pages())[0];
//     await loginToBtcpay(page);
//     await setLndNodeToStore(storeId, lndBtcpayUrl, page);
// };
//
// export const initializeBtcpayServices = async (
//         userEmail: string,
//         bip49RootPublicKey: string,
//         paymentExpirationMinutes: number,
//         lnd: Lnd): Promise<UserBtcpayDetails> => {
//     let storeName: string;
//     storeName = `${userEmail}-${formatDateWithTime2(new Date().getTime())}`;
//     logInfo(`Initializing BTCPay services for user LND: ${lnd.lndId}`);
//     const browser = await getBrowser();
//     const page = (await browser.pages())[0];
//     await loginToBtcpay(page);
//     const storeId: string = await createStore(storeName, page);
//     await addBtcRootPublicKeyToStore(storeId, page, browser, bip49RootPublicKey);
//     const lndAddress: string = generateBtcPayCustomLndAddress(
//         lnd.lndRestAddress,
//         lnd.macaroonHex!,
//         lnd.tlsCertThumbprint,
//     );
//     await setLndNodeToStore(storeId, lndAddress, page);
//     await setExpirationMinutesToStore(storeId, String(paymentExpirationMinutes), page);
//     const pairingCode: string = await getBtcpayPairingCode(storeName, storeId, page);
//     const btcpayUserAuthToken: BtcpayUserAuthToken = await generateApiToken(pairingCode);
//     await addCustomLogoAndCssToStorePaymentWidget(page, storeId);
//     return new UserBtcpayDetails(userEmail, storeId, btcpayUserAuthToken);
//     // return new UserBtcpayDetails(userEmail, storeId, new BtcpayUserAuthToken('asdf', 'asdf'));
// };
//
// const addCustomLogoAndCssToStorePaymentWidget = async (page: any, storeId: string): Promise<void> => {
//     await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}/checkout`);
//     await page.waitForSelector('input#CustomLogo');
//     await page.type('#CustomLogo', `${getProperty('CLIENT_URL_ADDRESS')}/statics/bittery-glow-last.svg`);
//     await page.type('#CustomCSS', `${getProperty('CLIENT_URL_ADDRESS')}/statics/checkout.css`);
//     await page.waitForSelector('button[name="command"]');
//     await page.click('button[name="command"]');
//     await page.waitForSelector('div.alert.alert-success.alert-dismissible');
//     logInfo(`Successfully set custom logo and checkout CSS to store with id ${storeId}`);
// };
//
// const getBrowser = async() => {
//     return await puppeteer.launch({ headless: true }).then(
//         (v: any) => v,
//         (err: any) => {
//             if (IGNORE_SANDBOX_ERROR === '1') {
//                 console.warn(
//                     'WARNING!!! Error occurred, Chromium will be started ' +
//                     'without sandbox. This wont guarantee success.',
//                 );
//                 return puppeteer.launch({
//                     headless: true,
//                     ignoreDefaultArgs: ['--disable-extensions'],
//                     args: ['--no-sandbox', '--disable-setuid-sandbox'],
//                     defaultViewport : { width: 1024, height: 1600 },
//                 });
//             } else {
//                 console.warn(
//                     'If "No usable sandbox!" error, retry test with ' +
//                     'BTCPAY_IGNORE_SANDBOX_ERROR=1',
//                 );
//                 throw err;
//             }
//         },
//     );
// };
//
// export const loginToBtcpay = async (page: any): Promise<void> => {
//     await page.setDefaultTimeout(10 * 1000);
//     await page.goto(`${getProperty('BTCPAY_URL')}/Account/Login`);
//     await page.type('#Email', USER_NAME);
//     await page.type('#Password', PASSWORD);
//     await page.click('#LoginButton');
//     await page.waitForSelector('div.header-content-inner.text-white');
//     logInfo(`Successfully logged to BTCPAY`);
// };
//
// const getBtcpayPairingCode = async (storeName: string, storeId: string, page: any): Promise<string> => {
//     const tokenName = `${storeName}-${new Date().getTime()}`;
//     await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}/Tokens/Create`);
//     await page.waitForSelector('input#Label');
//     await page.waitForSelector('[type="submit"]');
//     await page.type('#Label', tokenName);
//     await page.click('input[type="submit"]');
//     await page.waitForSelector('button[type="submit"]');
//     await page.click('button#ApprovePairing');
//     await page.waitForSelector('div.alert.alert-success.alert-dismissible');
//     const contents = await page.evaluate(() => {
//         const el = document.querySelector(
//             'div.alert.alert-success.alert-dismissible',
//         );
//         if (el === null) {
//             return '';
//         }
//         return el.innerHTML;
//     });
//     const pairingCode = (contents.match(
//         /Server initiated pairing code: (\S{7})/,
//     ) || [])[1];
//     if (!pairingCode) {
//         throw new Error('Could not get pairing code');
//     }
//     logInfo(`Got pairing code for storeId ${storeId}`);
//     return pairingCode;
// };
//
// const createStore = async (storeName: string, page: any): Promise<string> => {
//     await page.goto(`${getProperty('BTCPAY_URL')}/stores/create`);
//     await page.waitForSelector('input#Name');
//     await page.waitForSelector('[type="submit"]');
//     await page.type('#Name', storeName);
//     // await page.click('button');
//     // await page.waitForSelector('button#ApprovePairing');
//     // await page.click('button#ApprovePairing');
//     await page.click('input[type="submit"]');
//     // await page.waitForSelector('button[type="submit"]');
//     // await page.click('input[type="submit"]');
//     await page.waitForSelector('input#Id');
//     const element = await page.$('#Id');
//     const storeId = await page.evaluate((element: any) => element.value, element);
//     logInfo(`Store ${storeName} created! New Id: ${storeId}, name: ${storeName}`);
//     return storeId;
// };
//
// const setLndNodeToStore = async (storeId: string, lndBtcpayUrl: string, page: any): Promise<void> => {
//     await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}/lightning/BTC`);
//     const label = await page.evaluateHandle(() => {
//         return [...document.querySelectorAll('label')].find(h1 => h1.innerText === 'Use custom node');
//     });
//     await label.click();
//     await page.waitForSelector('input#ConnectionString');
//     // @ts-ignore
//     // clean the input first
//     await page.evaluate(() => document.getElementById('ConnectionString').value = '');
//     await page.type('#ConnectionString', lndBtcpayUrl);
//     // await page.waitForSelector('button[type=submit]');
//     // await page.screenshot({ path: 'example.png' });
//     await page.click('button#save');
//     await page.waitForSelector('div.alert.alert-success.alert-dismissible');
//     logInfo(`Added btcpay lnd address for store with id ${storeId}`);
// };
//
// const setExpirationMinutesToStore = async (storeId: string, paymentExpirationMinutes: string, page: any): Promise<void> => {
//     await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}`);
//     await page.waitForSelector('input#InvoiceExpiration');
//     // @ts-ignore
//     await page.evaluate(() => document.getElementById('InvoiceExpiration').value = '');
//     await page.type('#InvoiceExpiration', paymentExpirationMinutes);
//     // await page.waitForSelector('button[type="submit"]');
//     // await page.click('[type="submit"]');
//     await page.waitForSelector('button#Save');
//     await page.click('button#Save');
//     await page.waitForSelector('div.alert.alert-success.alert-dismissible');
//     logInfo(`Set invoice expiration time ${paymentExpirationMinutes} minutes for store ${storeId}`);
// };
//
// export const addBtcRootPublicKeyToStore = async (storeId: string, page: any, browser: any, bip49RootPublicKey: string): Promise<void> => {
//     await page.goto(`${getProperty('BTCPAY_URL')}/stores/${storeId}`);
//     await page.waitForSelector('a#ModifyBTC');
//     // await page.screenshot({ path: 'example.png' });
//     const aHref = await page.evaluate(
//         () => Array.from(
//             document.querySelectorAll('a#ModifyBTC'),
//             a => a.getAttribute('href'),
//         ),
//     );
//     await page.goto(`${getProperty('BTCPAY_URL')}${aHref}`);
//     await page.waitForSelector('a#ImportWalletOptionsLink');
//     const aHref2 = await page.evaluate(
//         () => Array.from(
//             document.querySelectorAll('a#ImportWalletOptionsLink'),
//             a => a.getAttribute('href'),
//         ),
//     );
//     await page.goto(`${getProperty('BTCPAY_URL')}${aHref2}`);
//     await page.waitForSelector('a#ImportXpubLink');
//     const aHref3 = await page.evaluate(
//         () => Array.from(
//             document.querySelectorAll('a#ImportXpubLink'),
//             a => a.getAttribute('href'),
//         ),
//     );
//     await page.goto(`${getProperty('BTCPAY_URL')}${aHref3}`);
//     await page.waitForSelector('textarea#DerivationScheme');
//     await page.type('#DerivationScheme', bip49RootPublicKey);
//     await page.waitForSelector('button#Continue');
//     await page.click('button#Continue');
//     await page.waitForSelector('button#Confirm');
//     await page.click('button#Confirm');
//     await page.waitForSelector('div.alert.alert-success.alert-dismissible');
//     logInfo(`Successfully added Bitcoin root public key for store with id ${storeId}`);
// };
