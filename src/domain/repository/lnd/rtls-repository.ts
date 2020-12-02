import { dbPool } from '../../../application/db/db';
import { PoolClient } from 'pg';
import { Rtl } from '../../model/lnd/hosted/rtl/rtl';

export const insertUserRtl = async (client: PoolClient, rtl: Rtl): Promise<void> => {
    await client.query(`
        INSERT INTO RTLS(LND_ID, RTL_ONE_TIME_INIT_PASSWORD, RTL_VERSION) VALUES($1, $2, $3)`,
        [rtl.lndId, rtl.rtlOneTimeInitPassword, rtl.rtlVersion]);
};

export const findUserRtl = async (userEmail: string): Promise<Rtl | undefined> => {
    const result = await dbPool.query(`SELECT * FROM RTLS rtl JOIN LNDS lnd ON rtl.LND_ID = lnd.LND_ID 
                                        WHERE lnd.USER_EMAIL = $1`, [userEmail]);
    return  result.rows.length === 1 ?
        new Rtl(
            result.rows[0].lnd_id,
            result.rows[0].one_time_init_password,
            result.rows[0].rtl_version,
        ) : undefined;
};
