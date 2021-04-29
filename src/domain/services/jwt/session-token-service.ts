import jwt from 'jsonwebtoken';
import { getProperty } from '../../../application/property-service';
import { logError } from '../../../application/logging-service';

export const generateJwtToken = (userId: string, sha256PasswordProof?: string): string => {
    return jwt.sign(
        {
            userId,
            passwordProof: sha256PasswordProof ?? '',
        },
        getProperty('OAUTH2_TOKEN_CLIENT_SECRET'),
        {
            expiresIn: `${getProperty('SESSION_EXPIRES_IN_HOURS')}h`,
        },
    );
};

export const generateRefreshToken = (userId: string, sha256PasswordProof?: string): string => {
    return jwt.sign(
        {
            userId,
            passwordProof: sha256PasswordProof ?? '',
        },
        getProperty('OAUTH2_TOKEN_CLIENT_SECRET'),
    );
};

export const verifyUserTokenAndGetUserEmailAndPasswordProof = async (jwtToken: string): Promise<any> => {
    try {
        return new Promise((resolve, reject) => {
            jwt.verify(jwtToken, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'), (err, decoded) => {
                if (decoded) {
                    // @ts-ignore
                    return resolve({ userId: decoded!.userId, passwordProof: decoded!.passwordProof });
                } else {
                    return reject(`JWT verification ${jwtToken} failed!`);
                }
            });
        });
    } catch (err) {
        const errorMessage: string = `Authorization error: ${err}`;
        logError(errorMessage);
        throw new Error(errorMessage);
    }
};
