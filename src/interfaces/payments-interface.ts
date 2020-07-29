import { Request, Response } from 'express-serve-static-core';
import { getUserEmailFromAccessTokenInAuthorizationHeader } from '../domain/services/auth/token-extractor-service';
import { LndCreateException } from '../domain/model/lnd/lnd-create-exception';
import { ErrorDto } from './dto/error-dto';
import { LndCreationErrorType } from '../domain/model/lnd/lnd-creation-error-type';
import { SaveInvoiceDto } from './dto/save-invoice-dto';
import { getInvoicePdf, getInvoices, saveInvoice } from '../domain/services/payments/invoice-service';
import { UserBtcpayException } from '../domain/services/btcpay/user-btcpay-exception';
import { getBooleanProperty } from '../application/property-service';
import { logError } from '../application/logging-service';

export const saveInvoiceApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    try {
        if (getBooleanProperty('CREATE_INVOICE_ENABLED')) {
            const saveInvoiceDto: SaveInvoiceDto = req.body;
            await saveInvoice(userEmail, saveInvoiceDto);
            return res.status(200).send();
        } else {
            return res.status(500).send(new ErrorDto('Maintenance: Creating invoice feature currently disabled'));
        }
    } catch (err) {
        if (err instanceof LndCreateException) {
            return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
        }
        logError(`Failed to save invoice for user ${userEmail}`, err);
        return res.status(500).send(new ErrorDto('LND services creation failed',
            LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
    }
};

export const getInvoicesApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    try {
        // @ts-ignore
        const invoices: object[] = await getInvoices(userEmail);
        return res.status(200).send(invoices);
    } catch (err) {
        if (err instanceof UserBtcpayException) {
            return res.status(400).send(new ErrorDto(err.message, err.clientErrorCode));
        }
        logError(`Failed to get invoices for user ${userEmail}`, err);
        return res.status(500).send(new ErrorDto('LND services creation failed',
            LndCreationErrorType.LND_CREATION_FAILED_SERVER_ERROR));
    }
};

export const getInvoicePdfApi = async (req: Request, res: Response): Promise<Response> => {
    const userEmail: string = await getUserEmailFromAccessTokenInAuthorizationHeader(req);
    try {
        const invoiceId: string = req.params.invoiceId;
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
};
