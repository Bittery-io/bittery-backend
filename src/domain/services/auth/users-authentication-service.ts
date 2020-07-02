import { storeJWTOauthInDatabase } from '../../repository/authentication-repository';
import { getProperty } from '../../../application/property-service';
import { generateToken } from '../jwt/session-token-service';

export const generateAndSaveNewAccessTokenForUser = (userId: string): string => {
    const accessToken: string = generateToken(userId, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'));
    storeJWTOauthInDatabase(userId, accessToken);
    return accessToken;
};
