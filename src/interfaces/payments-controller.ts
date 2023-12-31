import { Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { LndCreateException } from '../domain/model/lnd/lnd-create-exception';
import { ErrorDto } from './dto/error-dto';
import { LndCreationErrorType } from '../domain/model/lnd/lnd-creation-error-type';
import { SaveInvoiceDto } from './dto/save-invoice-dto';
import { getInvoicePdf, getInvoices, saveInvoice } from '../domain/services/payments/invoice-service';
import { UserBtcpayException } from '../domain/services/btcpay/user-btcpay-exception';
import { getBooleanProperty } from '../application/property-service';
import { logError } from '../application/logging-service';
import { Authorized, Body, Get, HeaderParam, JsonController, Param, Post, Res } from 'routing-controllers';
import { BtcpayInvoice } from '../domain/model/btcpay/invoices/btcpay-invoice';

@JsonController('/payments')
@Authorized()
export class PaymentsController {

    @Post('/')
    async saveInvoiceApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Body({ required: true }) saveInvoiceDto: SaveInvoiceDto,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            if (getBooleanProperty('CREATE_INVOICE_ENABLED')) {
                await saveInvoice(userEmail, saveInvoiceDto);
                return res.status(200).send();
            } else {
                return res.status(500).send(new ErrorDto('Maintenance: Creating invoice feature currently disabled'));
            }
        } catch (err) {
            logError(`Failed to save invoice for user ${userEmail}`, err);
            if (err instanceof UserBtcpayException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            return res.status(500).send(new ErrorDto('LND services creation failed',
                LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
        }
    }

    @Get('/invoices')
    async getInvoicesApi(
            @HeaderParam('authorization', { required: true }) authorizationHeader: string,
            @Res() res: Response): Promise<Response> {
        const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(authorizationHeader);
        try {
            const invoices: BtcpayInvoice[] = await getInvoices(userEmail, 50);
            return res.status(200).send(invoices);
        } catch (err) {
            logError(`Failed to get invoices for user ${userEmail}`, err);
            if (err instanceof UserBtcpayException) {
                return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
            }
            return res.status(500).send(new ErrorDto('Get invoices failed!',
                LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
        }
    }

    @Get('/pdf/:invoiceId')
    async getInvoicePdfApi(
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
