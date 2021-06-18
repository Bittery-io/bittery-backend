import { dbPool } from '../../application/db/db';
import { UserEncryptedLnArtefacts } from '../model/user/user-encrypted-ln-artefacts';
import { PoolClient } from 'pg';

export const insertUserEncryptedLnArtefacts = async (client: PoolClient, userEncryptedArtefacts: UserEncryptedLnArtefacts): Promise<void> => {
    await client.query(`
                INSERT INTO USER_ENCRYPTED_LN_ARTEFACTS(USER_EMAIL, LND_ID, ADMIN_MACAROON_HEX, LN_SEED, LN_PASSWORD)
                VALUES ($1, $2, $3, $4, $5)`,
        [userEncryptedArtefacts.userEmail,
            userEncryptedArtefacts.lndId,
            userEncryptedArtefacts.adminMacaroonHex,
            userEncryptedArtefacts.lnSeed,
            userEncryptedArtefacts.lnPassword]);
};

export const updateAdminMacaroonArtefact = async (userEmail: string, lndId: string, adminMacaroonHex: string): Promise<void> => {
    await dbPool.query(`UPDATE USER_ENCRYPTED_LN_ARTEFACTS
                        SET ADMIN_MACAROON_HEX = $1
                        WHERE USER_EMAIL = $2
                        AND LND_ID = $3`,
        [adminMacaroonHex, userEmail, lndId]);
};

export const findAdminMacaroonHexArtefact = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT ADMIN_MACAROON_HEX FROM USER_ENCRYPTED_LN_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2`,
        [userEmail, lndId]);
    return result.rows.length === 1 ? result.rows[0].admin_macaroon_hex : undefined;
};

export const findLnPasswordArtefact = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT LN_PASSWORD FROM USER_ENCRYPTED_LN_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2`,
        [userEmail, lndId]);
    return result.rows.length === 1 ? result.rows[0].ln_password : undefined;
};

export const findUserEncryptedArtefacts = async (userEmail: string, lndId: string): Promise<UserEncryptedLnArtefacts | undefined> => {
    const result = await dbPool.query(`SELECT ADMIN_MACAROON_HEX, LN_PASSWORD, LN_SEED FROM USER_ENCRYPTED_LN_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2`,
        [userEmail, lndId]);
    return result.rows.length === 1 ? new UserEncryptedLnArtefacts(
        userEmail,
        lndId,
        result.rows[0].admin_macaroon_hex,
        result.rows[0].ln_seed,
        result.rows[0].ln_password,
    ) : undefined;
};

// todo IT WILL WORK UNTIL THERE IS SINGLE LND PER USER
export const findLnSeedArtefact = async (userEmail: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT LN_SEED FROM USER_ENCRYPTED_LN_ARTEFACTS WHERE USER_EMAIL = $1`,
        [userEmail]);
    return result.rows.length === 1 ? result.rows[0].ln_seed : undefined;
};