import { Response } from 'express-serve-static-core';
import { createUserBtcpayServices } from '../domain/services/btcpay/btcpay-service';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { ErrorDto } from './dto/error-dto';
import { UserBtcpayException } from '../domain/services/btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../domain/services/btcpay/user-btcpay-error-type';
import { CreateUserBtcpayDto } from './dto/create-user-btcpay-dto';
import { logError, logInfo } from '../application/logging-service';
import { Authorized, Body, Get, HeaderParam, JsonController, Param, Post, Res } from 'routing-controllers/index';
import { ExtendSubscriptionDto } from './dto/account/extend-subscription-dto';
import {
    extendSubscription,
    getUserSubscription,
    getUserSubscriptionBillingInvoices,
} from '../domain/services/subscription/subscription-service';
import { SubscriptionDto } from './dto/account/subscription-dto';
import { ExtendSubscriptionResultDto } from './dto/account/extend-subscription-result-dto';
import { BillingDto } from './dto/account/billing-dto';
import { getInvoicePdf } from '../domain/services/payments/invoice-service';
import { LndCreateException } from '../domain/model/lnd/lnd-create-exception';
import { LndCreationErrorType } from '../domain/model/lnd/lnd-creation-error-type';
const crypto = require('crypto');

@JsonController('/account')
@Authorized()
export class AccountController {

    @Get('/billing')
    async getBillingDetails(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response,
            @Body({ required: true }) createUserBtcpayDto: CreateUserBtcpayDto) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            logInfo(`Starting creating BTCPAY user services for email ${userEmail}`);
            await createUserBtcpayServices(userEmail, createUserBtcpayDto);
            logInfo(`Successfully created user BTCPAY services for email ${userEmail}`);
            return res.status(200).send();
        } catch (err) {
            if (err instanceof UserBtcpayException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError('Failed to add user BTCPAY services services', err);
            return res.status(500).send(new ErrorDto('LND services creation failed',
                UserBtcpayErrorType.BTCPAY_INIT_FAILED_SERVER_ERROR));
        }
    }

    @Post('/subscription')
    async subscribeApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response,
            @Body({ required: true }) extendSubscriptionDto: ExtendSubscriptionDto) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const invoiceId: string | undefined = await extendSubscription(userEmail, extendSubscriptionDto);
            if (invoiceId) {
                return res.status(200).send(new ExtendSubscriptionResultDto(invoiceId));
            } else {
                return res.sendStatus(400);
            }
        } catch (err) {
            logError(`Extending subscription for user ${userEmail} and months ${extendSubscriptionDto.subscriptionTimeMonths} failed!`, err);
            return res.status(500).send(new ErrorDto('Unexpected server error occurred'));
        }
    }

    @Get('/subscription')
    async getSubscriptionApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const subscriptionDto: SubscriptionDto = await getUserSubscription(userEmail);
            logInfo(`Returning get subscription response to user ${userEmail}`);
            return res.status(200).send(subscriptionDto);
        } catch (err) {
            logError(`Getting subscription for user ${userEmail} failed with err`, err);
            return res.status(500).send(new ErrorDto('Unexpected server error occurred'));
        }
    }

    @Get('/subscription/billings')
    async getSubscriptionBillingInvoicesApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response) {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const billingDtos: BillingDto[] = await getUserSubscriptionBillingInvoices(userEmail);
            logInfo(`Returning user subscription billing invoices for user ${userEmail}`);
            return res.status(200).send(billingDtos);
        } catch (err) {
            logError(`Getting subscription billing invoices for user ${userEmail} failed with err`, err);
            return res.status(500).send(new ErrorDto('Unexpected server error occurred'));
        }
    }

    // todo
    @Get('/pdf/:invoiceId')
    async getBtcpayInvoicePdfApi(
        @HeaderParam('authorization', { required: true }) authorizationHeader: string,
        @Param('invoiceId') invoiceId: string,
        @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const pdf: Buffer = await getInvoicePdf(userEmail, invoiceId);
            res.contentType('application/pdf');
            return res.status(200).send(pdf);
        } catch (err) {
            if (err instanceof LndCreateException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            logError(`Failed to get invoices for user ${userEmail}`, err);
            return res.status(500).send(new ErrorDto('LND services creation failed',
                LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
        }
    }
}
