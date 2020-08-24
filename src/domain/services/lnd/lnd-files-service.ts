import { findUserDomain } from '../../repository/user-domains-repository';
import { UserDomain } from '../../model/lnd/user-domain';
import { getMacaroonBase64, getTlsBase64 } from '../../../application/lnd-connect-service';

export const readMacaroonBase64 = async (email: string): Promise<string> => {
    const userDomain: UserDomain | undefined = await findUserDomain(email);
    if (userDomain) {
        return await getMacaroonBase64(userDomain.userDomain);
    } else {
        throw new Error(`Cannot get tls certificate for email ${email} because has not domain!`);
    }
};

export const readTlsBase64 = async (email: string): Promise<string> => {
    const userDomain: UserDomain | undefined = await findUserDomain(email);
    if (userDomain) {
        return await getTlsBase64(userDomain.userDomain);
    } else {
        throw new Error(`Cannot get tls certificate for email ${email} because has not domain!`);
    }
};
