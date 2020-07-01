import bcrypt from 'bcrypt';
import { getProperty } from '../../../application/property-service';

export const encodePassword = (password: string): string => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(Number(getProperty('ENCRYPTION_PASSWORD_SALT_ROUNDS'))));
};

export const validatePlainPassword = async (password: string): Promise<void> => {
    if (!password || password === '') {
        return Promise.reject(new Error('Plain password validation failed because is null or empty!'));
    }
};

export const validatePlainPasswords = async (password: string, repeatPassword: string): Promise<void> => {
    if (password !== repeatPassword) {
        return Promise.reject(new Error('Plain passwords validation failed!'));
    }
};

export const validatePassword = async (encodedPassword: string, password: string): Promise<void> => {
    if (!(await bcrypt.compare(password, encodedPassword))) {
        return Promise.reject(new Error('Password validation failed.'));
    }
};
