import { dbPool } from '../../application/db/db';
import { UserPasswordProof } from '../model/artefacts/user-password-proof';

export const insertUserPasswordProof = async (userPasswordProof: UserPasswordProof): Promise<void> => {
    await dbPool.query(`
                INSERT INTO USER_PASSWORD_PROOFS(USER_EMAIL, SHA_256_PASSWORD_PROOF)
                VALUES ($1, $2)`,
        [userPasswordProof.userEmail, userPasswordProof.sha256PasswordProof]);
};
