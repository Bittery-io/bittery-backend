import { storeJWTOauthInDatabase } from '../../repository/authentication-repository';
import { getProperty } from '../../../application/property-service';
import { generateJwtToken } from '../jwt/session-token-service';

export const generateAndSaveNewJwtForUser = (userId: string, sha256PasswordProof?: string): string => {
    const accessToken: string = generateJwtToken(userId, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'), sha256PasswordProof);
    storeJWTOauthInDatabase(userId, accessToken);
    return accessToken;
};
