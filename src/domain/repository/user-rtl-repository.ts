import { dbPool } from '../../application/db/db';
import { UserRtl } from '../model/lnd/rtl/user-rtl';

export const insertUserRtl = async (userDomain: string, rtlInitPassword: string): Promise<void> => {
    await dbPool.query(`
        INSERT INTO USER_RTLS(USER_DOMAIN, RTL_INIT_PASSWORD) VALUES($1, $2)`, [userDomain, rtlInitPassword]);
};

export const findUserRtl = async (userEmail: string): Promise<UserRtl | undefined> => {
    const result = await dbPool.query(`SELECT * FROM USER_RTLS ur JOIN USER_DOMAINS ud ON
        ur.USER_DOMAIN = ud.USER_DOMAIN WHERE ud.USER_EMAIL = $1`, [userEmail]);
    return  result.rows.length === 1 ?
        new UserRtl(
            result.rows[0].user_domain,
            result.rows[0].rtl_init_password,
        ) : undefined;
};
