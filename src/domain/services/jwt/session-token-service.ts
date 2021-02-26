import jwt from 'jsonwebtoken';
import { getProperty } from '../../../application/property-service';
import { logError } from '../../../application/logging-service';

export const generateJwtToken = (userId: string, secret: string, sha256PasswordProof?: string): string => {
    return jwt.sign(
        {
            userId,
            passwordProof: sha256PasswordProof ?? '',
        },
        secret,
        {
            expiresIn: `${getProperty('SESSION_EXPIRES_IN_HOURS')}h`,
        },
    );
};

export const verifyUserTokenAndGetUserEmail = async (jwtToken: string): Promise<string> => {
    try {
        return new Promise((resolve, reject) => {
            jwt.verify(jwtToken, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'), (err, decoded) => {
                if (decoded) {
                    // @ts-ignore
                    return resolve(decoded!.userId);
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

export const decodeTokenAndGetEmail = (jwtToken: string): string | undefined => {
    try {
        const jwtTokenDecoded = jwt.decode(jwtToken);
        // @ts-ignore
        return jwtTokenDecoded!.userId;
    } catch (err) {
        logError('Error decoding jwt token!');
        return undefined;
    }
};
