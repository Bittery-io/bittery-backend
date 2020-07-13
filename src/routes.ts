import * as express from 'express';
import { Router } from 'express-serve-static-core';
import {
    createLndApi,
    getAdminMacaroonFileApi, getCustomLndApi, getCustomTlsFile,
    getTlsCertificateFileApi,
    getUserLndApi, saveExistingLndApi,
} from './interfaces/lnd-interface';
import {
    confirmRegistrationApi,
    confirmResetPasswordApi, isLoggedApi,
    login, refreshTokenApi,
    registerUser,
    resetPasswordApi,
} from './interfaces/user-interface';
import { createUserBtcpayApi } from './interfaces/btcpay-interface';
import { getUserBtcWalletApi } from './interfaces/btc-interface';
import { getInvoicePdfApi, getInvoicesApi, saveInvoiceApi } from './interfaces/payments-interface';

const router: Router = express.Router();

const lndRoutes: Router = express.Router();
lndRoutes.route('/').post(createLndApi);
lndRoutes.route('/existing').post(saveExistingLndApi);
lndRoutes.route('/user').get(getUserLndApi);
lndRoutes.route('/custom').get(getCustomLndApi);
lndRoutes.route('/files/tls').get(getTlsCertificateFileApi);
lndRoutes.route('/files/tls/custom').get(getCustomTlsFile);
lndRoutes.route('/files/macaroon').get(getAdminMacaroonFileApi);
router.use('/lnd', lndRoutes);

const userRoutes: Router = express.Router();
userRoutes.route('/isLogged').get(isLoggedApi);
userRoutes.route('/register').post(registerUser);
userRoutes.route('/login').post(login);
userRoutes.route('/refreshToken').post(refreshTokenApi);
userRoutes.route('/register/confirm').post(confirmRegistrationApi);
userRoutes.route('/password/reset').post(resetPasswordApi);
userRoutes.route('/password/reset/confirm').post(confirmResetPasswordApi);
router.use('/user', userRoutes);

const btcpayRoutes: Router = express.Router();
btcpayRoutes.route('/').post(createUserBtcpayApi);
router.use('/btcpay', btcpayRoutes);

const btcRoutes: Router = express.Router();
btcRoutes.route('/wallet').get(getUserBtcWalletApi);
router.use('/btc', btcRoutes);

const paymentsRoutes: Router = express.Router();
paymentsRoutes.route('/').post(saveInvoiceApi);
paymentsRoutes.route('/invoices').get(getInvoicesApi);
paymentsRoutes.route('/pdf/:invoiceId').get(getInvoicePdfApi);
router.use('/payments', paymentsRoutes);
export default router;
