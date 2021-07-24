import { HostedLnd } from '../../model/lnd/hosted/hosted-lnd';
import { PoolClient } from 'pg';
import { dbPool } from '../../../application/db/db';

export const insertHostedLnd = async (client: PoolClient, hostedLnd: HostedLnd): Promise<void> => {
    await client.query(`
        INSERT INTO HOSTED_LNDS(LND_ID, HOSTED_LND_TYPE, HOSTED_LND_PROVIDER, WUMBO_CHANNELS, LN_ALIAS)
        VALUES($1, $2, $3, $4, $5)`,
        [hostedLnd.lndId, hostedLnd.hostedLndType, hostedLnd.hostedLndProvider, hostedLnd.wumboChannels, hostedLnd.lnAlias]);
};

export const findUserHostedLnd = async (userEmail: string): Promise<HostedLnd[]> => {
    const result = await dbPool.query(`SELECT * FROM HOSTED_LNDS hl JOIN LNDS l ON hl.LND_ID = l.lnd_id 
                                                      WHERE l.USER_EMAIL = $1`, [userEmail]);
    return result.rows.map(row => new HostedLnd(
        row.lnd_id,
        userEmail,
        row.lnd_rest_address,
        row.tls_cert,
        row.tls_cert_thumbprint,
        row.lnd_version,
        row.lnd_type,
        row.hosted_lnd_type,
        row.hosted_lnd_provider,
        row.creation_date,
        row.wumbo_channels,
        row.ln_alias,
        row.macaroon_hex,
    ));
};
