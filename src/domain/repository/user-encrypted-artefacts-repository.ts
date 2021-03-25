import { dbPool } from '../../application/db/db';
import { UserEncryptedArtefacts } from '../model/user/user-encrypted-artefacts';

export const insertUserEncryptedArtefacts = async (userEncryptedArtefacts: UserEncryptedArtefacts): Promise<void> => {
    await dbPool.query(`
                INSERT INTO USER_ENCRYPTED_ARTEFACTS(USER_EMAIL, LND_ID, ADMIN_MACAROON, LN_SEED, LN_PASSWORD, STANDARD_WALLET_SEED)
                VALUES ($1, $2, $3, $4, $5, $6)`,
        [userEncryptedArtefacts.userEmail,
            userEncryptedArtefacts.lndId,
            userEncryptedArtefacts.adminMacaroon,
            userEncryptedArtefacts.lnSeed,
            userEncryptedArtefacts.lnPassword,
            userEncryptedArtefacts.standardWalletSeed]);
};

export const updateAdminMacaroonArtefact = async (userEmail: string, lndId: string, adminMacaroon: string): Promise<void> => {
    await dbPool.query(`UPDATE USER_ENCRYPTED_ARTEFACTS
                        SET ADMIN_MACAROON = $1
                        WHERE USER_EMAIL = $2
                        AND LND_ID = $3`,
        [adminMacaroon, userEmail, lndId]);
};

export const findAdminMacaroonArtefact = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT ADMIN_MACAROON FROM USER_ENCRYPTED_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2`,
        [userEmail, lndId]);
    return result.rows.length === 1 ? result.rows[0].admin_macaroon : undefined;
};

export const findLnPasswordArtefact = async (userEmail: string, lndId: string): Promise<string | undefined> => {
    const result = await dbPool.query(`SELECT LN_PASSWORD FROM USER_ENCRYPTED_ARTEFACTS
                        WHERE USER_EMAIL = $1
                        AND LND_ID = $2`,
        [userEmail, lndId]);
    return result.rows.length === 1 ? result.rows[0].ln_password : undefined;
};

export const updateStandardWalletSeedArtefact = async (userEmail: string, lndId: string, standardWalletSeed: string): Promise<void> => {
    await dbPool.query(`UPDATE USER_ENCRYPTED_ARTEFACTS
                        SET STANDARD_WALLET_SEED = $1
                        WHERE USER_EMAIL = $2
                        AND LND_ID = $3`,
        [standardWalletSeed, userEmail, lndId]);
};
