import { getMacaroonBase64, getTlsBase64 } from '../../../application/lnd-connect-service';

// todo zaczytaj z bazy
export const readMacaroonBase64 = async (userEmail: string): Promise<string> => {
    // const userDomain: UserDomain | undefined = await findUserDomain(userEmail);
    // if (userDomain) {
    //     return await getMacaroonBase64(userDomain.userDomain);
    // } else {
    //     throw new Error(`Cannot get tls certificate for email ${userEmail} because has not domain!`);
    // }
    return '';
};

// todo zaczytaj z bazy
export const readTlsBase64 = async (email: string): Promise<string> => {
    // const userDomain: UserDomain | undefined = await findUserDomain(email);
    // if (userDomain) {
    //     return await getTlsBase64(userDomain.userDomain);
    // } else {
    //     throw new Error(`Cannot get tls certificate for email ${email} because has not domain!`);
    // }
    return '';
};
