import { dbPool } from '../../../application/db/db';
import { PoolClient } from 'pg';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { Lnd } from '../../model/lnd/lnd';
import { LndType } from '../../model/lnd/lnd-type';

export const insertLnd = async (client: PoolClient, lnd: Lnd): Promise<void> => {
    await client.query(`
        INSERT INTO LNDS(LND_ID, USER_EMAIL, LND_REST_ADDRESS, MACAROON_HEX,
                         TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE, CREATION_DATE)
                         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [lnd.lndId, lnd.userEmail, lnd.lndRestAddress, lnd.macaroonHex, lnd.tlsCert,
            lnd.tlsCertThumbprint, lnd.lndVersion, lnd.lndType, lnd.creationDate]);
};

export const findAllLnds = async (): Promise<Lnd[]> => {
    const result = await dbPool.query(`SELECT LND_ID, USER_EMAIL, LND_REST_ADDRESS, MACAROON_HEX,
                                              TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE FROM LNDS`, []);
    return result.rows.map(row => new Lnd(
        row.lnd_id,
        row.user_email,
        row.lnd_rest_address,
        row.tls_cert,
        row.tls_cert_thumbprint,
        row.lnd_version,
        row.lnd_type,
        row.creation_date,
        row.macaroon_hex,
    ));

};

export const userHasLnd = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM LNDS WHERE USER_EMAIL = $1)`, [userEmail]);
    return result.rows[0].exists;
};

export const findLndRestAddress = async (lndId: string, userEmail: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT LND_REST_ADDRESS FROM LNDS WHERE LND_ID = $1 AND USER_EMAIL = $2`,
        [lndId, userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? result.rows[0].lnd_rest_address : undefined;
};

export const findLndMacaroonHex = async (lndId: string, userEmail: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT MACAROON_HEX FROM LNDS WHERE LND_ID = $1 AND USER_EMAIL = $2`,
        [lndId, userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? result.rows[0].macaroon_hex : undefined;
};

// todo docelowo powinno byc po lndId wtedy user moze miec wiecej, na razie jedno starczy
// todo zmien LND_ADDRESS na LND_IP_ADDRESS
export const findUserLnd = async (userEmail: string): Promise<Lnd | undefined> => {
    const result = await dbPool.query(`SELECT LND_ID, USER_EMAIL, LND_REST_ADDRESS, MACAROON_HEX,
                                              TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE FROM LNDS WHERE USER_EMAIL = $1`,
        [userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? new Lnd(
        foundRow.lnd_id,
        foundRow.user_email,
        foundRow.lnd_rest_address,
        foundRow.tls_cert,
        foundRow.tls_cert_thumbprint,
        foundRow.lnd_version,
        foundRow.lnd_type,
        foundRow.creation_date,
        foundRow.macaroon_hex,
    ) : undefined;
};

export const updateLndSetMacaroonHex = async (client: PoolClient, lndId: string, macaroonHex: string): Promise<void> => {
    await client.query('UPDATE LNDS SET MACAROON_HEX = $1 WHERE LND_ID = $2',
        [macaroonHex, lndId]);
};

export const findUserLndTls = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT TLS_CERT FROM LNDS WHERE USER_EMAIL = $1 AND LND_ID = $2`,
        [userEmail, lndId]);
    const foundRow = result.rows[0];
    return foundRow.tls_cert;
};
