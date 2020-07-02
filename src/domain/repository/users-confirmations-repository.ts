import { UserConfirmation } from '../model/user/user-confirmation';
import { dbPool } from '../../application/db/db';

export const saveUserConfirmation = async (userConfirmation: UserConfirmation): Promise<void> => {
    await dbPool.query(`
                INSERT INTO USERS_CONFIRMATIONS(USER_EMAIL, SIGN_UP_KEY, MESSAGE_ID, CONFIRMED, CREATION_DATE)
                VALUES ($1, $2, $3, $4, $5)`,
        [userConfirmation.userEmail, userConfirmation.signUpKey, userConfirmation.messageId,
            userConfirmation.confirmed, userConfirmation.creationDate]);
};

export const userConfirmationExists = async (userEmail: string): Promise<boolean> => {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM USERS_CONFIRMATIONS WHERE USER_EMAIL = $1)',
        [userEmail]);
    return result.rows[0].exists;
};

export const unconfirmedUserConfirmationExists = async (userEmail: string, signUpKey: string): Promise<boolean> => {
    const result = await dbPool.query(`SELECT EXISTS(SELECT 1 FROM USERS_CONFIRMATIONS WHERE USER_EMAIL = $1
                                        AND CONFIRMED = FALSE AND SIGN_UP_KEY = $2)`,
        [userEmail, signUpKey]);
    return result.rows[0].exists;
};

export const confirmUserIfSignUpKeyValid = async (userEmail: string, signUpKey: string): Promise<void> => {
    await dbPool.query(`UPDATE USERS_CONFIRMATIONS SET CONFIRMED = TRUE, CONFIRMATION_DATE = $1 WHERE
                                       USER_EMAIL = $2 AND SIGN_UP_KEY = $3`,
        [new Date().toUTCString(), userEmail, signUpKey]);
};
