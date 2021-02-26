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
