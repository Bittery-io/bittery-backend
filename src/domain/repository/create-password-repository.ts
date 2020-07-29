import { dbPool } from '../../application/db/db';
import { PasswordReset } from '../model/user/password-reset';
import { getProperty } from '../../application/property-service';
import { PoolClient } from 'pg';

export const insertPasswordReset = async (client: PoolClient, passwordReset: PasswordReset): Promise<void> => {
    await client.query(`
                INSERT INTO PASSWORD_RESETS(USER_EMAIL, PASSWORD_RESET_KEY, RESET_DONE, MESSAGE_ID, CREATION_DATE, RESET_DONE_DATE)
                VALUES ($1, $2, $3, $4, $5, $6)`,
        [passwordReset.userEmail, passwordReset.passwordResetKey, passwordReset.resetDone,
            passwordReset.messageId, passwordReset.creationDate, passwordReset.resetDoneDate]);
};

export const findUnconfirmedValidPasswordReset = async (userEmail: string, passwordResetKey: string): Promise<PasswordReset | undefined> => {
    const result = await dbPool.query(`
                SELECT * FROM PASSWORD_RESETS WHERE USER_EMAIL = $1 AND RESET_DONE = false AND PASSWORD_RESET_KEY = $2 
                                                AND CREATION_DATE > NOW() - INTERVAL '${getProperty('PASSWORD_RESET_LINK_VALIDITY_HOURS')} hours'`,
        [userEmail, passwordResetKey]);
    return result.rows.length === 1 ?
        new PasswordReset(
            result.rows[0].user_email,
            result.rows[0].password_reset_key,
            result.rows[0].reset_done,
            result.rows[0].message_id,
            result.rows[0].creation_date,
            result.rows[0].reset_done_date,
        ) : undefined;
};

export const updateConfirmPasswordResetWithResetDone = async (client: PoolClient, userEmail: string, passwordResetKey: string): Promise<void> => {
    await client.query(`UPDATE PASSWORD_RESETS SET RESET_DONE = TRUE, RESET_DONE_DATE = $1
                                    WHERE USER_EMAIL = $2 AND PASSWORD_RESET_KEY = $3`,
        [new Date(), userEmail, passwordResetKey]);
};
