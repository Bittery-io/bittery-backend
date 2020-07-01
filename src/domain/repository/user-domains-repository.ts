import { dbPool } from '../../application/db/db';
import { UserDomain } from '../model/lnd/user-domain';

export const insertUserDomain = async (userDomain: UserDomain): Promise<void> => {
    await dbPool.query(`
        INSERT INTO USER_DOMAINS(USER_EMAIL, USER_DOMAIN) VALUES($1, $2)`,
                       [userDomain.userEmail, userDomain.userDomain]);
};

export const userHasDomain = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM USER_DOMAINS WHERE USER_EMAIL = $1)', [userEmail]);
    return result.rows[0].exists;
};

export const domainExists = async (domain: string): Promise<boolean> => {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM USER_DOMAINS WHERE USER_DOMAIN = $1)', [domain]);
    return result.rows[0].exists;
};

export const findUserDomain = async (userEmail: string): Promise<UserDomain | undefined> => {
    const result = await dbPool.query(`SELECT * FROM USER_DOMAINS WHERE USER_EMAIL = $1`, [userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? new UserDomain(
        foundRow.user_email,
        foundRow.user_domain,
    ) : undefined;
};
