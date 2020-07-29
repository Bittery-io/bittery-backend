import { dbPool } from '../../application/db/db';
import { PoolClient } from 'pg';

export const insertUserLnd = async (client: PoolClient, userDomain: string, lndPort: number): Promise<void> => {
    await client.query(`
        INSERT INTO USER_LNDS(USER_DOMAIN, LND_PORT) VALUES($1, $2)`, [userDomain, lndPort]);
};

export const findCurrentHighestLndPort = async (): Promise<number | undefined> => {
    const result = await dbPool.query(`SELECT MAX(LND_PORT) FROM USER_LNDS`);
    const foundRow = result.rows[0];
    return foundRow ? foundRow.max : undefined;
};

export const userHasLnd = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM USER_LNDS ul JOIN USER_DOMAINS ud ON
        ul.USER_DOMAIN = ud.USER_DOMAIN WHERE ud.USER_EMAIL = $1)`, [userEmail]);
    return result.rows[0].exists;
};
