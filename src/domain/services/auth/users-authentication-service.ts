import jwt from 'jsonwebtoken';
import { JwtToken } from '../../model/jwt-token';
import { storeJWTOauthInDatabase } from '../../repository/authentication-repository';
import { getProperty } from '../../../application/property-service';
import { generateToken } from '../jwt/session-token-service';

export const generateAndSaveNewAccessTokenForUser = (userId: string): string => {
    const newJwtToken: JwtToken = prepareTokenForEcmrUser(userId);
    storeJWTOauthInDatabase(newJwtToken.accessToken, newJwtToken);
    return newJwtToken.accessToken;
};

export const generateRefreshTokenForEcmrUser = (jwtToken: JwtToken): string => {
    const decodedToken: null | { [key: string]: any } | string = jwt.decode(jwtToken.accessToken);
    const email: string = (<{ [key: string]: any }>decodedToken!).email!;
    if (email) {
        return generateAndSaveNewAccessTokenForUser(email);
    } else {
        throw new Error('You don\'t have any token for refreshing. Please login again!');
    }
};

const prepareTokenForEcmrUser = (userEmail: string): JwtToken => {
    const accessToken: string = generateToken(userEmail, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'));
    const refreshToken: string = generateToken(userEmail, getProperty('OAUTH2_TOKEN_CLIENT_SECRET'));
    const expireIn: number = Number(getProperty('ENCRYPTION_TOKEN_EXPIRE_IN_HOURS'));
    return new JwtToken(accessToken, refreshToken, expireIn , userEmail);
};
