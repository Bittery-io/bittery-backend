import { Request } from 'express-serve-static-core';
import { verifyUserTokenAndGetUserEmail } from './access-authorization-service';

export const getAccessTokenFromAuthorizationHeader = (authorizationHeader: string | undefined): string => {
    if (authorizationHeader) {
        const formattedString: string[] = authorizationHeader.split('Bearer ');
        if (formattedString.length > 0) {
            return formattedString[1];
        }
    }
    throw Error(`Authorization header ${authorizationHeader} is incorrect. Should be 'Bearer ACCESS_TOKEN'.`);
};

export const getUserEmailFromAccessTokenInAuthorizationHeader = async (req: Request): Promise<string> => {
    const accessToken: string = getAccessTokenFromAuthorizationHeader(req.headers.authorization!);
    // @ts-ignore
    return (await verifyUserTokenAndGetUserEmail(accessToken));
};
