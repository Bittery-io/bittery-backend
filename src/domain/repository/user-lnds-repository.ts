import { dbPool } from '../../application/db/db';
import { PoolClient } from 'pg';
import { LndType } from '../model/lnd/lnd-type';

export const insertUserLnd = async (client: PoolClient, userDomain: string, lndType: LndType): Promise<void> => {
    await client.query(`
        INSERT INTO USER_LNDS(USER_DOMAIN, LND_TYPE) VALUES($1, $2)`, [userDomain, lndType]);
};

export const userHasLnd = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM USER_LNDS ul JOIN USER_DOMAINS ud ON
        ul.USER_DOMAIN = ud.USER_DOMAIN WHERE ud.USER_EMAIL = $1)`, [userEmail]);
    return result.rows[0].exists;
};
