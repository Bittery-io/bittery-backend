import { dbPool } from '../../application/db/db';
import { UserPasswordProof } from '../model/artefacts/user-password-proof';

export const insertUserPasswordProof = async (userPasswordProof: UserPasswordProof): Promise<void> => {
    await dbPool.query(`
                INSERT INTO USER_PASSWORD_PROOFS(USER_EMAIL, CREATION_DATE, SHA_256_PASSWORD_PROOF)
                VALUES ($1, $2, $3)`,
        [userPasswordProof.userEmail, userPasswordProof.creationDate, userPasswordProof.sha256PasswordProof]);
};

export const findUserPasswordProof = async (userEmail: string): Promise<UserPasswordProof | undefined> => {
    const result = await dbPool.query(`
                SELECT CREATION_DATE, SHA_256_PASSWORD_PROOF  FROM USER_PASSWORD_PROOFS WHERE USER_EMAIL = $1`, [userEmail]);
    const foundRow = result.rows[0];
    return foundRow ? new UserPasswordProof(userEmail, foundRow.sha_256_password_proof, foundRow.creation_date) : undefined;
};
