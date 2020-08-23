import fs from 'fs';
import path from 'path';
import { getProperty } from '../../../application/property-service';
import { findUserDomain } from '../../repository/user-domains-repository';
import { UserDomain } from '../../model/lnd/user-domain';
import { getMacaroon } from '../../../application/lnd-connect-service';
const util = require('util');

const readFile = util.promisify(fs.readFile);

export const getDomainLndFile = async (email: string, fileName: string): Promise<string> => {
    const userDomain: UserDomain | undefined = await findUserDomain(email);
    if (userDomain) {
        return await getMacaroon(userDomain.userDomain);
    } else {
        throw new Error(`Cannot get tls certificate for email ${email} because has not domain!`);
    }
};
