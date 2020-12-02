import { dbPool } from '../../../application/db/db';
import { PoolClient } from 'pg';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { Lnd } from '../../model/lnd/lnd';

export const insertLnd = async (client: PoolClient, lnd: Lnd): Promise<void> => {
    await client.query(`
        INSERT INTO LNDS(LND_ID, USER_EMAIL, LND_ADDRESS, LND_REST_ADDRESS, MACAROON_HEX,
                         TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [lnd.lndId, lnd.userEmail, lnd.lndAddress, lnd.lndRestAddress, lnd.macaroonHex, lnd.tlsCert,
            lnd.tlsCertThumbprint, lnd.lndVersion, lnd.lndType]);
};

export const userHasLnd = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM LNDS WHERE USER_EMAIL = $1)`, [userEmail]);
    return result.rows[0].exists;
};

export const findLndRestAddress = async (lndId: string, userEmail: string): Promise<string> => {
    const result = await dbPool.query(`SELECT LND_REST_ADDRESS FROM LNDS WHERE LND_ID = $1 AND USER_EMAIL = $2`,
        [lndId, userEmail]);
    return result.rows[0].lnd_rest_address;
};

// todo docelowo powinno byc po lndId wtedy user moze miec wiecej, na razie jedno starczy
export const findLnd = async (userEmail: string): Promise<Lnd | undefined> => {
    const result = await dbPool.query(`SELECT LND_ID, USER_EMAIL, LND_ADDRESS, LND_REST_ADDRESS, MACAROON_HEX,
                                              TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE FROM LNDS WHERE USER_EMAIL = $1`,
        [userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? new Lnd(
        foundRow.lnd_id,
        foundRow.user_email,
        foundRow.lnd_address,
        foundRow.lnd_rest_address,
        foundRow.tls_cert,
        foundRow.tls_cert_thumbprint,
        foundRow.lnd_version,
        foundRow.lnd_type,
        foundRow.macaroon_hex,
    ) : undefined;
};
