import { SaveInvoiceDto } from '../../../interfaces/dto/save-invoice-dto';
import { UserBtcpayDetails } from '../../model/btcpay/user-btcpay-details';
import { findUserBtcpayDetails } from '../../repository/user-btcpay-details-repository';
import { createBtcpayInvoice, getBtcpayInvoice, getBtcpayInvoices } from '../btcpay/btcpay-client-service';
import { UserBtcpayException } from '../btcpay/user-btcpay-exception';
import { UserBtcpayErrorType } from '../btcpay/user-btcpay-error-type';
import { BtcpayInvoice } from '../../model/btcpay/btcpay-invoice';
import { generateInvoicePdf } from '../pdf/invoice-pdf-generator-service';
import { Invoice } from 'btcpay';
import { logInfo } from '../../../application/logging-service';
import { getCustomLndUrl, getLndUrl } from '../../../application/lnd-connect-service';
import { findUserDomain } from '../../repository/user-domains-repository';
import { UserDomain } from '../../model/lnd/user-domain';
import { findCustomLnd } from '../../repository/custom-lnds-repository';
import { getRounds } from 'bcrypt';
import { CustomLnd } from '../../model/lnd/custom-lnd';

export const saveInvoice = async (userEmail: string, saveInvoiceDto: SaveInvoiceDto): Promise<void> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const btcpayInvoice: BtcpayInvoice = await createBtcpayInvoice(saveInvoiceDto, userBtcpayDetails.btcpayUserAuthToken!);
        logInfo(`Created new invoice with id ${btcpayInvoice.id} for user email ${userEmail}`);
    } else {
        throw new UserBtcpayException(`Cannot create invoice because user ${userEmail} has not btcpay yet!`, UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoices = async (userEmail: string): Promise<object[]> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        return await getBtcpayInvoices(userBtcpayDetails.btcpayUserAuthToken);
    } else {
        throw new UserBtcpayException(`Cannot get invoices because user ${userEmail} has not btcpay yet!`,
        UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};

export const getInvoicePdf = async (userEmail: string, invoiceId: string): Promise<Buffer> => {
    const userBtcpayDetails: UserBtcpayDetails | undefined = await findUserBtcpayDetails(userEmail);
    if (userBtcpayDetails) {
        const invoice: Invoice =  await getBtcpayInvoice(userBtcpayDetails.btcpayUserAuthToken, invoiceId);
        const userDomain: UserDomain | undefined = await findUserDomain(userEmail);
        let lndUrl: string | undefined;
        if (userDomain) {
            lndUrl = await getLndUrl(userDomain!.userDomain);
            if (!lndUrl) {
                // tslint:disable-next-line:max-line-length
                throw new UserBtcpayException(`Cannot get pdf invoice because could not get LND (offline?) address for domain ${userDomain!.userDomain}!`,
                    UserBtcpayErrorType.COULD_NOT_GET_LND_ADDRESS);
            }
        } else {
            const userCustomLnd: CustomLnd | undefined = await findCustomLnd(userEmail);
            lndUrl = await getCustomLndUrl(userCustomLnd!.macaroonHex, userCustomLnd!.lndRestAddress, userCustomLnd!.tlsCert);
            if (!lndUrl) {
                // tslint:disable-next-line:max-line-length
                throw new UserBtcpayException(`Cannot get pdf invoice because could not get LND (offline?) address for user custom LND : ${userCustomLnd?.lndRestAddress}!`,
                    UserBtcpayErrorType.COULD_NOT_GET_LND_ADDRESS);
            }
        }
        return await generateInvoicePdf(invoice, userEmail, lndUrl!);
    } else {
        throw new UserBtcpayException(`Cannot get pdf invoice because user ${userEmail} has not btcpay yet!`,
            UserBtcpayErrorType.USER_HAS_NOT_BTCPAY);
    }
};
