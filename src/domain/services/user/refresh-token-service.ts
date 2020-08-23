import { getJWTOauthFromDatabase } from '../../repository/authentication-repository';
import { decodeTokenAndGetEmail, verifyUserTokenAndGetUserEmail } from '../jwt/session-token-service';
import { generateAndSaveNewJwtForUser } from '../auth/users-authentication-service';
import { RefreshTokenException } from './refresh-token-exception';
import { logInfo } from '../../../application/logging-service';

export const getNewJwtToken = async (jwtToken: string): Promise<string> => {
    const userEmail: string | undefined =  await verifyUserTokenAndGetUserEmail(jwtToken);
    if (userEmail) {
        const jwtTokenInDb: string | undefined = getJWTOauthFromDatabase(userEmail);
        if (jwtTokenInDb) {
            if (jwtTokenInDb === jwtToken) {
                const newJwt: string =  generateAndSaveNewJwtForUser(userEmail);
                logInfo(`Successfully refreshed token (JWT) for user ${userEmail}`);
                return newJwt;
            } else {
                const message: string = `Cannot refresh token because given JWT is already outdated: ${jwtToken} `;
                throw new RefreshTokenException(message);
            }
        } else {
            const message: string = `Refresh token failed because given JWT is not saved in Bittery: ${jwtToken} `;
            throw new RefreshTokenException(message);
        }
    } else {
        const message: string = `Refresh token failed because - it should not happen but decoding JWT token failed: ${jwtToken}`;
        throw new RefreshTokenException(message);
    }
};
