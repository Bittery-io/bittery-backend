import { getArrayProperty } from '../../../application/property-service';
import { getAccessTokenFromAuthorizationHeader } from './token-extractor-service';
import { getJWTOauthFromDatabase } from '../../repository/authentication-repository';
import { verifyUserTokenAndGetUserEmail } from '../jwt/session-token-service';
import { Action } from 'routing-controllers/Action';

export const authorizeRequest = async (action: Action, roles: string[]) => {
    const authorizationHeader: string = action.request.headers['authorization'];
    try {
        return await hasUserAccess(getAccessTokenFromAuthorizationHeader(authorizationHeader));
    } catch (err) {
        return false;
    }
};

const hasUserAccess = async (jwtToken: string): Promise<boolean> => {
    try {
        const userEmail: string = await verifyUserTokenAndGetUserEmail(jwtToken);
        const jwtInDb: string | undefined = getJWTOauthFromDatabase(userEmail);
        // This gives the possibility to user be logged on single device over time
        return jwtInDb !== undefined && (jwtInDb! === jwtToken);
    } catch (err) {
        return false;
    }
};
