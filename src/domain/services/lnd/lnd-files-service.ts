import fs from 'fs';
import path from 'path';
import { getProperty } from '../../../application/property-service';
import { findUserDomain } from '../../repository/user-domains-repository';
import { UserDomain } from '../../model/lnd/user-domain';

export const getDomainLndFile = async (email: string, fileName: string): Promise<Buffer> => {
    const userDomain: UserDomain | undefined = await findUserDomain(email);
    if (userDomain) {
        return fs.readFileSync(path.resolve(
            `${getProperty('BITTERY_INFRASTRUCTURE_PATH')}/volumes/lnd/${userDomain.userDomain}/bitcoin/datadir/${fileName}`));
    } else {
        throw new Error(`Cannot get tls certificate for email ${email} because has not domain!`);
    }
};
