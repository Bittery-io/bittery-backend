import { dbPool } from '../../application/db/db';
import { UserEncryptedArtefacts } from '../model/user/user-encrypted-artefacts';

export const inserUserEncryptedArtefacts = async (userEncryptedArtefacts: UserEncryptedArtefacts): Promise<void> => {
    await dbPool.query(`
                INSERT INTO USER_ENCRYPTED_ARTEFACTS(USER_EMAIL, LND_ID, ADMIN_MACAROON)
                VALUES ($1, $2, $3)`,
        [userEncryptedArtefacts.userEmail,
            userEncryptedArtefacts.lndId,
            userEncryptedArtefacts.adminMacaroon]);
};
