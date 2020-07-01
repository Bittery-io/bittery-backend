import { dbPool } from '../../application/db/db';
import { CustomLnd } from '../model/lnd/custom-lnd';

export const insertCustomLnd = async (customLnd: CustomLnd): Promise<void> => {
    await dbPool.query(`
        INSERT INTO CUSTOM_LNDS(USER_EMAIL, LND_REST_ADDRESS, MACAROON_HEX, TLS_CERT, TLS_CERT_THUMBPRINT) VALUES($1, $2, $3, $4, $5)`,
        [customLnd.userEmail, customLnd.lndRestAddress, customLnd.macaroonHex, customLnd.tlsCert, customLnd.tlsCertThumbprint]);
};

export const userHasCustomLnd = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM CUSTOM_LNDS WHERE USER_EMAIL = $1)`, [userEmail]);
    return result.rows[0].exists;
};

export const findCustomLnd = async (userEmail: string): Promise<CustomLnd | undefined> => {
    const query: string = `SELECT * FROM CUSTOM_LNDS WHERE USER_EMAIL = $1`;
    const result = await dbPool.query(query, [userEmail]);
    return result.rows.length === 1 ?
        new CustomLnd(
            result.rows[0].user_email,
            result.rows[0].lnd_rest_address,
            result.rows[0].macaroon_hex,
            result.rows[0].tls_cert,
            result.rows[0].tls_cert_thumbprint,
        ) : undefined;
};

export const findCustomLndTlsCert = async (userEmail: string): Promise<string | undefined> => {
    const query: string = `SELECT TLS_CERT FROM CUSTOM_LNDS WHERE USER_EMAIL = $1`;
    const result = await dbPool.query(query, [userEmail]);
    return result.rows.length === 1 ? result.rows[0].tls_cert : undefined;
};
