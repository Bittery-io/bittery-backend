import { getJWTOauthFromDatabase } from '../../repository/authentication-repository';
import { decodeTokenAndGetEmail } from '../jwt/session-token-service';
import { generateAndSaveNewJwtForUser } from '../auth/users-authentication-service';
import { RefreshTokenException } from './refresh-token-exception';

export const getNewJwtToken = (jwtToken: string): string => {
    const userEmail: string | undefined = decodeTokenAndGetEmail(jwtToken);
    if (userEmail) {
        const jwtTokenInDb: string | undefined = getJWTOauthFromDatabase(userEmail);
        if (jwtTokenInDb) {
            const newJwt: string =  generateAndSaveNewJwtForUser(userEmail);
            console.log(`Successfully refreshed token (JWT) for user ${userEmail}`);
            return newJwt;
        } else {
            const message: string = `Refresh token failed because given JWT is not saved in Bittery: ${jwtToken} `;
            throw new RefreshTokenException(message);
        }
    } else {
        const message: string = `Refresh token failed becasue - it should not happen but decoding JWT token failed`;
        throw new RefreshTokenException(message);
    }
};
