import { dbPool } from '../../application/db/db';
import { User } from '../model/user/user';
import { PoolClient } from 'pg';

export const userExists = async (email: string): Promise<boolean> => {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM USERS WHERE EMAIL = $1)', [email]);
    return result.rows[0].exists;
};

export const userWithGivenEmailExists = async (email: string): Promise<boolean> => {
    const result = await dbPool.query('SELECT EXISTS(SELECT 1 FROM USERS WHERE EMAIL = $1 )', [email]);
    return result.rows[0].exists;
};

export const insertUser = async (user: User): Promise<void> => {
    const query: string = 'INSERT INTO USERS(EMAIL, PASSWORD, ACTIVE, CREATION_DATE) VALUES($1, $2, $3, $4)';
    await dbPool.query(query, [user.email, user.encodedPassword, user.active, user.creationDate]);
};

export const setUserActiveFlag = async (userEmail: string, active: boolean): Promise<void> => {
    const query: string = 'UPDATE USERS SET ACTIVE = $1 WHERE EMAIL = $2';
    await dbPool.query(query, [active, userEmail]);
};

export const updateUserPassword = async (client: PoolClient, userEmail: string, encodedPassword: string): Promise<void> => {
    const query: string = 'UPDATE USERS SET PASSWORD = $1 WHERE EMAIL = $2';
    await client.query(query, [encodedPassword, userEmail]);
};

export const findUser = async (email: string): Promise<User | undefined> => {
    const query: string = `SELECT * FROM USERS WHERE EMAIL = $1`;
    const result = await dbPool.query(query, [email]);
    return result.rows.length === 1 ?
        new User(
            result.rows[0].email,
            result.rows[0].password,
            result.rows[0].active,
            result.rows[0].creation_date,
        ) : undefined;
};
