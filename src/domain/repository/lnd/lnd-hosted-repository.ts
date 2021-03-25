import { HostedLnd } from '../../model/lnd/hosted/hosted-lnd';
import { PoolClient } from 'pg';
import { dbPool } from '../../../application/db/db';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';

export const insertHostedLnd = async (client: PoolClient, hostedLnd: HostedLnd): Promise<void> => {
    await client.query(`
        INSERT INTO HOSTED_LNDS(LND_ID, HOSTED_LND_TYPE, HOSTED_LND_PROVIDER, WUMBO_CHANNELS, LN_ALIAS)
        VALUES($1, $2, $3, $4, $5)`,
        [hostedLnd.lndId, hostedLnd.hostedLndType, hostedLnd.hostedLndProvider, hostedLnd.wumboChannels, hostedLnd.lnAlias]);
};

export const findUserHostedLndType = async (userEmail: string): Promise<HostedLndType | undefined> => {
    const result = await dbPool.query(`SELECT HOSTED_LND_TYPE FROM HOSTED_LNDS hl JOIN LNDS l ON hl.LND_ID = l.lnd_id 
                                                      WHERE l.USER_EMAIL = $1`, [userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? foundRow.hosted_lnd_type : undefined;
};
