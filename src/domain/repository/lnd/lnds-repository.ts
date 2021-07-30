import { dbPool } from '../../../application/db/db';
import { PoolClient } from 'pg';
import { HostedLndType } from '../../model/lnd/hosted/hosted-lnd-type';
import { Lnd } from '../../model/lnd/lnd';
import { LndType } from '../../model/lnd/lnd-type';
import { LndAggregate } from '../../model/lnd/lnd-aggregate';
import { HostedLnd } from '../../model/lnd/hosted/hosted-lnd';
import { DigitalOceanLnd } from '../../model/lnd/hosted/digital_ocean/digital-ocean-lnd';
import { Rtl } from '../../model/lnd/hosted/rtl/rtl';

export const insertLnd = async (client: PoolClient, lnd: Lnd): Promise<void> => {
    await client.query(`
        INSERT INTO LNDS(LND_ID, USER_EMAIL, LND_REST_ADDRESS, MACAROON_HEX,
                         TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE, IS_ACTIVE, CREATION_DATE, PUBLIC_KEY)
                         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [lnd.lndId, lnd.userEmail, lnd.lndRestAddress, lnd.macaroonHex, lnd.tlsCert,
            lnd.tlsCertThumbprint, lnd.lndVersion, lnd.lndType, lnd.isActive, lnd.creationDate, lnd.publicKey]);
};

export const findAllActiveLnds = async (): Promise<Lnd[]> => {
    const result = await dbPool.query(`SELECT LND_ID, USER_EMAIL, LND_REST_ADDRESS, MACAROON_HEX,
                                              TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE, IS_ACTIVE, PUBLIC_KEY
                                               FROM LNDS WHERE IS_ACTIVE = true`, []);
    return result.rows.map(row => new Lnd(
        row.lnd_id,
        row.user_email,
        row.lnd_rest_address,
        row.tls_cert,
        row.tls_cert_thumbprint,
        row.lnd_version,
        row.lnd_type,
        row.creation_date,
        row.is_active,
        row.publicKey,
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
export const findUserActiveLnd = async (userEmail: string): Promise<Lnd | undefined> => {
    const result = await dbPool.query(`SELECT LND_ID, USER_EMAIL, LND_REST_ADDRESS, MACAROON_HEX,
                                              TLS_CERT, TLS_CERT_THUMBPRINT, LND_VERSION, LND_TYPE, IS_ACTIVE, PUBLIC_KEY
                                              FROM LNDS WHERE USER_EMAIL = $1 AND IS_ACTIVE = true`,
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
        foundRow.is_active,
        foundRow.public_key,
        foundRow.macaroon_hex,
    ) : undefined;
};

export const findUserActiveLndAggregate = async (userEmail: string): Promise<LndAggregate | undefined> => {
    const result = await dbPool.query(
        `SELECT l.LND_ID, l.LND_REST_ADDRESS, l.MACAROON_HEX, l.CREATION_DATE,
                                   l.TLS_CERT, l.TLS_CERT_THUMBPRINT, l.LND_VERSION, l.LND_TYPE, l.IS_ACTIVE, l.public_key,
                                   hl.hosted_lnd_type, hl.hosted_lnd_provider, hl.wumbo_channels, hl.ln_alias,
                                   dol.droplet_id, dol.droplet_name, dol.droplet_ip,
                                   r.rtl_one_time_init_password, r.rtl_version
                            FROM LNDS l LEFT JOIN HOSTED_LNDS hl on l.LND_ID = hl.LND_ID
                                        LEFT JOIN DIGITAL_OCEAN_LNDS dol on l.LND_ID = dol.LND_ID
                                        LEFT JOIN RTLS r on l.LND_ID = r.LND_ID
                            WHERE USER_EMAIL = $1 AND IS_ACTIVE = true`,
        [userEmail]);
    const foundRow = result.rows[0];
    if (foundRow) {
        const lnd: Lnd = new Lnd(
            foundRow.lnd_id,
            userEmail,
            foundRow.lnd_rest_address,
            foundRow.tls_cert,
            foundRow.tls_cert_thumbprint,
            foundRow.lnd_version,
            foundRow.lnd_type,
            foundRow.creation_date,
            foundRow.is_active,
            foundRow.public_key,
            foundRow.macaroon_hex,
        );
        let hostedLnd: HostedLnd | undefined;
        if (foundRow.hosted_lnd_type) {
            hostedLnd = new HostedLnd(
                lnd.lndId,
                userEmail,
                lnd.lndRestAddress,
                lnd.tlsCert,
                lnd.tlsCertThumbprint,
                lnd.lndVersion,
                lnd.lndType,
                foundRow.hosted_lnd_type,
                foundRow.hosted_lnd_provider,
                lnd.creationDate,
                foundRow.wumbo_channels,
                lnd.isActive,
                lnd.publicKey,
                foundRow.ln_alias,
                lnd.macaroonHex,
            );
        }
        let digitalOceanLnd: DigitalOceanLnd | undefined;
        if (foundRow.droplet_id) {
            digitalOceanLnd = new DigitalOceanLnd(
                userEmail,
                lnd.lndRestAddress,
                lnd.tlsCert,
                lnd.tlsCertThumbprint,
                lnd.lndVersion,
                lnd.lndId,
                foundRow.hosted_lnd_type,
                foundRow.droplet_id,
                foundRow.droplet_name,
                foundRow.droplet_ip,
                lnd.creationDate,
                foundRow.wumbo_channels,
                lnd.isActive,
                lnd.publicKey,
                foundRow.ln_alias,
                lnd.macaroonHex,
            );
        }
        let rtl: Rtl | undefined;
        if (foundRow.rtl_one_time_init_password) {
            rtl = new Rtl(
                lnd.lndId,
                foundRow.rtl_one_time_init_password,
                foundRow.rtl_version,
            );
        }
        return new LndAggregate(lnd, hostedLnd, digitalOceanLnd, rtl);
    } else {
        return undefined;
    }
};

export const findUserLndAggregatesNewestFirst = async (userEmail: string): Promise<LndAggregate[]> => {
    const result = await dbPool.query(
            `SELECT l.LND_ID, l.LND_REST_ADDRESS, l.MACAROON_HEX, l.CREATION_DATE,
                                   l.TLS_CERT, l.TLS_CERT_THUMBPRINT, l.LND_VERSION, l.LND_TYPE, l.IS_ACTIVE, l.public_key,
                                   hl.hosted_lnd_type, hl.hosted_lnd_provider, hl.wumbo_channels, hl.ln_alias,
                                   dol.droplet_id, dol.droplet_name, dol.droplet_ip,
                                   r.rtl_one_time_init_password, r.rtl_version
                            FROM LNDS l LEFT JOIN HOSTED_LNDS hl on l.LND_ID = hl.LND_ID
                                        LEFT JOIN DIGITAL_OCEAN_LNDS dol on l.LND_ID = dol.LND_ID
                                        LEFT JOIN RTLS r on l.LND_ID = r.LND_ID
                            WHERE USER_EMAIL = $1 ORDER BY CREATION_DATE DESC`,
        [userEmail]);
    const lndAggregates: LndAggregate[] = [];
    for (const foundRow of result.rows) {
        const lnd: Lnd = new Lnd(
            foundRow.lnd_id,
            userEmail,
            foundRow.lnd_rest_address,
            foundRow.tls_cert,
            foundRow.tls_cert_thumbprint,
            foundRow.lnd_version,
            foundRow.lnd_type,
            foundRow.creation_date,
            foundRow.is_active,
            foundRow.public_key,
            foundRow.macaroon_hex,
        );
        let hostedLnd: HostedLnd | undefined;
        if (foundRow.hosted_lnd_type) {
            hostedLnd = new HostedLnd(
                lnd.lndId,
                userEmail,
                lnd.lndRestAddress,
                lnd.tlsCert,
                lnd.tlsCertThumbprint,
                lnd.lndVersion,
                lnd.lndType,
                foundRow.hosted_lnd_type,
                foundRow.hosted_lnd_provider,
                lnd.creationDate,
                foundRow.wumbo_channels,
                lnd.isActive,
                lnd.publicKey,
                foundRow.ln_alias,
                lnd.macaroonHex,
            );
        }
        let digitalOceanLnd: DigitalOceanLnd | undefined;
        if (foundRow.droplet_id) {
            digitalOceanLnd = new DigitalOceanLnd(
                userEmail,
                lnd.lndRestAddress,
                lnd.tlsCert,
                lnd.tlsCertThumbprint,
                lnd.lndVersion,
                lnd.lndId,
                foundRow.hosted_lnd_type,
                foundRow.droplet_id,
                foundRow.droplet_name,
                foundRow.droplet_ip,
                lnd.creationDate,
                foundRow.wumbo_channels,
                lnd.isActive,
                lnd.publicKey,
                foundRow.ln_alias,
                lnd.macaroonHex,
            );
        }
        let rtl: Rtl | undefined;
        if (foundRow.rtl_one_time_init_password) {
            rtl = new Rtl(
                lnd.lndId,
                foundRow.rtl_one_time_init_password,
                foundRow.rtl_version,
            );
        }
        lndAggregates.push(new LndAggregate(lnd, hostedLnd, digitalOceanLnd, rtl));
    }
    return lndAggregates;
};

export const updateLndSetMacaroonHex = async (client: PoolClient, lndId: string, macaroonHex: string): Promise<void> => {
    await client.query('UPDATE LNDS SET MACAROON_HEX = $1 WHERE LND_ID = $2',
        [macaroonHex, lndId]);
};

export const updateLndSetPublicKey = async (client: PoolClient, lndId: string, publicKey: string): Promise<void> => {
    await client.query('UPDATE LNDS SET PUBLIC_KEY = $1 WHERE LND_ID = $2',
        [publicKey, lndId]);
};

export const updateLndSetIsActive = async (client: PoolClient, lndId: string, isActive: boolean): Promise<void> => {
    await client.query('UPDATE LNDS SET IS_ACTIVE = $1 WHERE LND_ID = $2',
        [isActive, lndId]);
};

export const findUserLndTls = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT TLS_CERT FROM LNDS WHERE USER_EMAIL = $1 AND LND_ID = $2`,
        [userEmail, lndId]);
    const foundRow = result.rows[0];
    return foundRow.tls_cert;
};
