import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { findUserBtcpayDetails } from '../../repository/user-btcpay-details-repository';
import { createBtcpayInvoice, getBtcpayInvoice, getBtcpayInvoices } from '../btcpay/btcpay-client-service';
import { UserBtcpayException } from '../btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../btcpay/user-btcpay-error-type';
import { generateInvoicePdf } from '../pdf/invoice-pdf-generator-service';
import { logInfo } from '../../../application/logging-service';
import { findUserActiveLndAggregate } from '../../repository/lnd/lnds-repository';
import { lndGetInfo } from '../lnd/api/lnd-api-service';
import { LndInfo } from '../../model/lnd/api/lnd-info';
import { LndAggregate } from '../../model/lnd/lnd-aggregate';
import { getBitteryInvoice } from './bittery-invoice-service';
import { getProperty } from '../../../application/property-service';
import {
    findStoreInvoicesOrderIdsLimit,
    insertStoreInvoice
} from '../../repository/btcpay/store-invoices-repository';
import { StoreInvoice } from '../btcpay/invoice/store-invoice';
import { InvoiceData, OpenAPI } from 'btcpay-greenfield-node-client';
import { BtcpayInvoice } from '../../model/btcpay/invoices/btcpay-invoice';

export const saveInvoice = async (userEmail: string, saveInvoiceDto: SaveInvoiceDto): Promise<void> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const btcpayInvoice: InvoiceData = await createBtcpayInvoice(saveInvoiceDto, userBtcpayDetails!);
        await insertStoreInvoice(new StoreInvoice(
            userBtcpayDetails.storeId,
            btcpayInvoice.metadata.orderId,
            btcpayInvoice.id!,
            new Date(),
        ))
        logInfo(`Created new invoice with id ${btcpayInvoice.id} for user email ${userEmail}`);
    } else {
        throw new UserBtcpayException(`Cannot create invoice because user ${userEmail} has not btcpay yet!`, UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoices = async (userEmail: string, limit: number): Promise<BtcpayInvoice[]> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const orderIds: string[] = await findStoreInvoicesOrderIdsLimit(userBtcpayDetails.storeId, limit);
        return await getBtcpayInvoices(userBtcpayDetails, orderIds);
    } else {
        throw new UserBtcpayException(`Cannot get invoices because user ${userEmail} has not btcpay yet!`,
        UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoicePdf = async (userEmail: string, invoiceId: string): Promise<Buffer> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const invoice: BtcpayInvoice = await getBtcpayInvoice(userBtcpayDetails, invoiceId);
        const lndAggregate: LndAggregate | undefined = await findUserActiveLndAggregate(userEmail);
        if (lndAggregate) {
            let lndUri: string;
            if (lndAggregate.digitalOceanLnd) {
                lndUri = `${lndAggregate.lnd.publicKey}@${lndAggregate.digitalOceanLnd.dropletIp}:9735`;
            } else {
                const lndInfo: LndInfo | undefined = await lndGetInfo(lndAggregate.lnd.lndRestAddress, lndAggregate.lnd.macaroonHex!);
                if (lndInfo) {
                    lndUri = lndInfo.uri;
                } else {
                    throw new UserBtcpayException(`Cannot get pdf invoice because could not get LND info for ${userEmail} and lnd id ${lndAggregate.lnd.lndId}, rest address ${lndAggregate.lnd.lndRestAddress}!`,
                        UserBtcpayErrorType.COULD_NOT_GET_LND_INFO);
                }
            }
            return await generateInvoicePdf(invoice, userEmail, lndUri);
        } else {
            throw new UserBtcpayException(`Cannot get pdf invoice because user ${userEmail} has not LND yet (or is inactive)!`,
                UserBtcpayErrorType.USER_HAS_NOT_LND);
        }
    } else {
        throw new UserBtcpayException(`Cannot get pdf invoice because user ${userEmail} has not btcpay yet!`,
            UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getBitteryInvoicePdf = async (userEmail: string, invoiceId: string): Promise<Buffer> => {
    const invoice: BtcpayInvoice = await getBitteryInvoice(invoiceId);
    if (invoice.invoiceData.metadata.buyerName === userEmail) {
        return await generateInvoicePdf(invoice, userEmail, getProperty('BITTERY_NODE_FOR_SUBSCRIPTION_URI'));
    } else {
        throw new UserBtcpayException(`Cannot get pdf invoice because user ${userEmail} has not LND yet (or is inactive)!`,
            UserBtcpayErrorType.USER_HAS_NOT_LND);
    }
};
