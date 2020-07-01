import jwt from 'jsonwebtoken';
import { getProperty } from '../../../application/property-service';

export const generateToken = (id: string, secret: string): string => {
    return jwt.sign(
        {
            userId: id,
        },
        secret,
        {
            expiresIn: `${getProperty('ENCRYPTION_TOKEN_EXPIRE_IN_HOURS')}h`,
        },
    );
};
