import { dbPool } from '../../application/db/db';

export const insertDisabledRegistrationUser = async (email, password, creationDate): Promise<void> => {
    const query: string = 'INSERT INTO disabled_registration_users(EMAIL, PASSWORD, CREATION_DATE) VALUES($1, $2, $3) ON CONFLICT(EMAIL) DO NOTHING';
    await dbPool.query(query, [email, password, creationDate]);
};

export const countDisabledRegistrationUsers = async (): Promise<number> => {
    const result = await dbPool.query('SELECT COUNT(*) FROM disabled_registration_users');
    return result.rows[0].count;
};
